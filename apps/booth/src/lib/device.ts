import { getDB, type DeviceInfo } from "./db";
import { isTauri } from "./tauri";
import { env } from "./env";

async function getStore() {
  if (!isTauri) return null;
  const { load } = await import("@tauri-apps/plugin-store");
  return load("settings.json");
}

export async function getDevice(): Promise<DeviceInfo | undefined> {
  const store = await getStore();
  if (store) {
    return (await store.get<DeviceInfo>("device")) ?? undefined;
  }
  const db = await getDB();
  return db.get("device", "device");
}

export async function setDevice(device: Omit<DeviceInfo, "key">): Promise<void> {
  const next: DeviceInfo = { key: "device", ...device };
  const store = await getStore();
  if (store) {
    await store.set("device", next);
    await store.save();
    return;
  }
  const db = await getDB();
  await db.put("device", next);
}

export async function sendHeartbeat(deviceToken: string): Promise<void> {
  const res = await fetch(`${env.API_URL}/booths/heartbeat`, {
    method: "POST",
    headers: { "X-Device-Token": deviceToken },
  });
  if (!res.ok) {
    throw new Error(`Heartbeat fallido (${res.status})`);
  }
}

export async function clearDevice(): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.delete("device");
    await store.save();
    return;
  }
  const db = await getDB();
  await db.delete("device", "device");
}