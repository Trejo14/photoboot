import { getDB, type QueueEntry } from "./db";
import { uploadPhoto } from "./upload";

export async function enqueuePhoto(
  blob: Blob,
  type: QueueEntry["type"],
  aiStyle: string | null
): Promise<QueueEntry> {
  const db = await getDB();
  const entry: QueueEntry = {
    id: crypto.randomUUID(),
    blob,
    type,
    aiStyle,
    createdAt: Date.now(),
    status: "pending",
  };
  await db.put("queue", entry);
  return entry;
}

export async function listPending(): Promise<QueueEntry[]> {
  const db = await getDB();
  const index = db.transaction("queue").store.index("by-status");
  return index.getAll("pending");
}

export async function listAll(): Promise<QueueEntry[]> {
  const db = await getDB();
  return db.getAll("queue");
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("queue", id);
}

export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get("queue", id);
  if (entry) {
    await db.put("queue", { ...entry, status: "failed", error });
  }
}

export async function flushPending(token: string): Promise<{ synced: number; failed: number }> {
  const db = await getDB();
  const pending = await listPending();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    await db.put("queue", { ...entry, status: "syncing" });
    try {
      await uploadPhoto(token, entry);
      await markSynced(entry.id);
      synced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      await markFailed(entry.id, message);
      failed++;
    }
  }

  return { synced, failed };
}