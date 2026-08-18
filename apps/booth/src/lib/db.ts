import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface QueueEntry {
  id: string;
  blob: Blob;
  type: "single" | "strip" | "gif" | "boomerang" | "video";
  aiStyle: string | null;
  createdAt: number;
  status: "pending" | "syncing" | "failed";
  error?: string;
}

export interface DeviceInfo {
  key: "device";
  boothId: string;
  eventId: string;
  deviceToken: string;
  boothName: string;
}

export interface PhotoboothDB extends DBSchema {
  queue: {
    key: string;
    value: QueueEntry;
    indexes: { "by-status": string };
  };
  device: {
    key: "device";
    value: DeviceInfo;
  };
}

let dbPromise: Promise<IDBPDatabase<PhotoboothDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PhotoboothDB>("photobooth", 1, {
      upgrade(db) {
        const queue = db.createObjectStore("queue", { keyPath: "id" });
        queue.createIndex("by-status", "status");
        db.createObjectStore("device", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}