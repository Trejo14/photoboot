import { getDB, type QueueEntry } from "./db";
import { uploadPhoto } from "./upload";
import { errorMessage } from "./errors";

export async function enqueuePhoto(
  blob: Blob,
  type: QueueEntry["type"],
  aiStyle: string | null,
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

// Everything still in the store is unsynced (synced entries are deleted),
// so this also picks up "failed" entries and any "syncing" entry left
// stuck by a crash mid-upload, letting the next flush retry them.
export async function listPending(): Promise<QueueEntry[]> {
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

export async function flushPending(
  token: string,
): Promise<{
  synced: number;
  failed: number;
  photoIds: string[];
  photoIdByEntryId: Record<string, string>;
}> {
  const db = await getDB();
  const pending = await listPending();
  let synced = 0;
  let failed = 0;
  const photoIds: string[] = [];
  const photoIdByEntryId: Record<string, string> = {};

  for (const entry of pending) {
    await db.put("queue", { ...entry, status: "syncing" });
    try {
      const photoId = await uploadPhoto(token, entry);
      await markSynced(entry.id);
      synced++;
      photoIds.push(photoId);
      photoIdByEntryId[entry.id] = photoId;
    } catch (err) {
      const message = errorMessage(err, "Error desconocido");
      await markFailed(entry.id, message);
      failed++;
    }
  }

  return { synced, failed, photoIds, photoIdByEntryId };
}
