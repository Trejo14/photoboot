import { isTauri } from "./tauri";

const ALGO = "SHA-256";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest(ALGO, data);
  return bufferToHex(hashBuffer);
}

export async function getAdminPinHash(): Promise<string | null> {
  if (!isTauri) {
    return localStorage.getItem("booth-admin-pin");
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  return (await store.get<string>("adminPinHash")) ?? null;
}

export async function setAdminPin(pin: string): Promise<void> {
  const hashed = await hashPin(pin);
  if (!isTauri) {
    localStorage.setItem("booth-admin-pin", hashed);
    return;
  }
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("settings.json");
  await store.set("adminPinHash", hashed);
  await store.save();
}

export async function hasAdminPin(): Promise<boolean> {
  const hash = await getAdminPinHash();
  return hash !== null && hash.length > 0;
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const stored = await getAdminPinHash();
  if (!stored) return false;
  const hashed = await hashPin(pin);
  return hashed === stored;
}
