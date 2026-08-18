import { getDB, type DeviceInfo } from "./db";

export async function getDevice(): Promise<DeviceInfo | undefined> {
  const db = await getDB();
  return db.get("device", "device");
}

export async function setDevice(device: Omit<DeviceInfo, "key">): Promise<void> {
  const db = await getDB();
  await db.put("device", { key: "device", ...device });
}

export async function clearDevice(): Promise<void> {
  const db = await getDB();
  await db.delete("device", "device");
}