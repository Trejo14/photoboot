import { env } from "./env";
import { isTauri } from "./tauri";
import { secureGet, secureSet } from "./secure-store";

export type LicensePlan = "free" | "pro" | "lifetime";

export interface LicenseInfo {
  licenseKey: string;
  plan: LicensePlan;
  status: "active" | "revoked";
  activatedAt: number;
  lastValidatedAt: number;
  expiresAt: number | null;
}

export const GRACE_DAYS = 7;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

export interface ActivateLicenseOutput {
  plan: LicensePlan;
  expiresAt: number | null;
  graceDays: number;
}

// La licencia se guarda por operador (identificado por su email de cuenta
// web) para que en una cabina compartida por varias personas, cada quien
// vea/use la suya al iniciar sesión — no una sola licencia global del
// dispositivo. `UNKNOWN_USER_KEY` es un cajón aparte para el caso raro de
// arrancar con un dispositivo ya registrado pero sin sesión válida (token
// vencido); en ese caso no hay forma de saber de quién es la licencia.
const UNKNOWN_USER_KEY = "__unknown__";
const LEGACY_GLOBAL_KEY = "license"; // clave usada antes de que existiera esto por-usuario

function storeKey(email: string | null): string {
  return `license:${email ?? UNKNOWN_USER_KEY}`;
}

function secureKeyName(email: string | null): string {
  return `licenseKey:${email ?? UNKNOWN_USER_KEY}`;
}

function legacyLocalStorageKey(): string {
  return "booth-license";
}

export async function getLicense(
  email: string | null,
): Promise<LicenseInfo | undefined> {
  if (!isTauri) {
    // No hay concepto de "usuario" fuera de Tauri (modo dev en navegador);
    // se mantiene el único slot de siempre.
    const raw = localStorage.getItem(legacyLocalStorageKey());
    return raw ? (JSON.parse(raw) as LicenseInfo) : undefined;
  }

  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");

  let licenseData =
    (await store.get<Omit<LicenseInfo, "licenseKey">>(storeKey(email))) ??
    undefined;

  // Migración de una sola vez: si esta identidad no tiene nada guardado
  // todavía pero existe la licencia global de antes de este cambio,
  // adóptala como suya y borra la global para no volver a migrarla.
  if (!licenseData && email) {
    const legacy =
      (await store.get<Omit<LicenseInfo, "licenseKey">>(LEGACY_GLOBAL_KEY)) ??
      undefined;
    if (legacy) {
      const legacyKey = await secureGet("licenseKey");
      await store.set(storeKey(email), legacy);
      await store.delete(LEGACY_GLOBAL_KEY);
      await store.save();
      if (legacyKey) {
        await secureSet(secureKeyName(email), legacyKey);
        await secureSet("licenseKey", null);
      }
      licenseData = legacy;
    }
  }

  if (!licenseData) return undefined;

  const licenseKey = await secureGet(secureKeyName(email));
  return {
    ...licenseData,
    licenseKey: licenseKey ?? "",
  };
}

export async function setLicense(
  email: string | null,
  license: LicenseInfo,
): Promise<void> {
  if (!isTauri) {
    localStorage.setItem(legacyLocalStorageKey(), JSON.stringify(license));
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const { licenseKey, ...rest } = license;
  await store.set(storeKey(email), rest);
  await store.save();
  await secureSet(secureKeyName(email), licenseKey);
}

export async function clearLicense(email: string | null): Promise<void> {
  if (!isTauri) {
    localStorage.removeItem(legacyLocalStorageKey());
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  await store.delete(storeKey(email));
  await store.save();
  await secureSet(secureKeyName(email), null);
}

export async function activateLicense(
  deviceToken: string,
  licenseKey: string,
  email: string | null,
): Promise<LicenseInfo> {
  const res = await fetch(`${env.API_URL}/licenses/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Token": deviceToken,
    },
    body: JSON.stringify({ licenseKey }),
  });
  if (!res.ok) {
    throw new Error(`Activación fallida (${res.status})`);
  }
  const data = (await res.json()) as ActivateLicenseOutput;
  const license: LicenseInfo = {
    licenseKey,
    plan: data.plan,
    status: "active",
    activatedAt: Date.now(),
    lastValidatedAt: Date.now(),
    expiresAt: data.expiresAt,
  };
  await setLicense(email, license);
  return license;
}

export async function validateLicense(
  deviceToken: string,
  email: string | null,
): Promise<void> {
  const res = await fetch(`${env.API_URL}/licenses/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Token": deviceToken,
    },
  });
  if (!res.ok) {
    throw new Error(`Validación fallida (${res.status})`);
  }
  const data = (await res.json()) as { plan: LicensePlan };
  const license = await getLicense(email);
  if (license) {
    await setLicense(email, {
      ...license,
      plan: data.plan,
      lastValidatedAt: Date.now(),
    });
  }
}

export function isLicenseExpired(license: LicenseInfo | undefined): boolean {
  if (!license) return true;
  if (license.status === "revoked") return true;
  if (license.expiresAt && license.expiresAt <= Date.now()) return true;
  if (Date.now() - license.lastValidatedAt > GRACE_MS) return true;
  // El reloj local retrocedió respecto a la última vez que se confirmó
  // contra el servidor — la forma más común de "hacer trampa" con la
  // fecha del sistema para seguir usando una licencia vencida. Esto no
  // sustituye la validación real: el servidor siempre usa SU propio
  // reloj en /licenses/validate, así que en línea la trampa no sirve de
  // nada de todas formas; esto solo cubre el caso sin conexión.
  if (Date.now() < license.lastValidatedAt) return true;
  return false;
}
