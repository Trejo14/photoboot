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

export async function getLicense(): Promise<LicenseInfo | undefined> {
  if (!isTauri) {
    const raw = localStorage.getItem("booth-license");
    return raw ? (JSON.parse(raw) as LicenseInfo) : undefined;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const licenseData = (await store.get<Omit<LicenseInfo, "licenseKey">>(
    "license"
  )) ?? undefined;
  if (!licenseData) return undefined;

  const licenseKey = await secureGet("licenseKey");
  return {
    ...licenseData,
    licenseKey: licenseKey ?? "",
  };
}

export async function setLicense(license: LicenseInfo): Promise<void> {
  if (!isTauri) {
    localStorage.setItem("booth-license", JSON.stringify(license));
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  const { licenseKey, ...rest } = license;
  await store.set("license", rest);
  await store.save();
  await secureSet("licenseKey", licenseKey);
}

export async function clearLicense(): Promise<void> {
  if (!isTauri) {
    localStorage.removeItem("booth-license");
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  await store.delete("license");
  await store.save();
  await secureSet("licenseKey", null);
}

export async function activateLicense(
  deviceToken: string,
  licenseKey: string
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
  await setLicense(license);
  return license;
}

export async function validateLicense(deviceToken: string): Promise<void> {
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
  const license = await getLicense();
  if (license) {
    await setLicense({ ...license, plan: data.plan, lastValidatedAt: Date.now() });
  }
}

export function isLicenseExpired(license: LicenseInfo | undefined): boolean {
  if (!license) return true;
  if (license.status === "revoked") return true;
  if (license.expiresAt && license.expiresAt <= Date.now()) return true;
  if (Date.now() - license.lastValidatedAt > GRACE_MS) return true;
  return false;
}
