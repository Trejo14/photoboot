import { env } from "./env";
import type { PresignUploadOutput } from "@photobooth/types";
import type { QueueEntry } from "./db";

export async function uploadPhoto(
  token: string,
  entry: QueueEntry
): Promise<string> {
  const presignRes = await fetch(`${env.API_URL}/photos/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Token": token,
    },
    body: JSON.stringify({
      type: entry.type,
      aiStyle: entry.aiStyle ?? "none",
      fileName: `${entry.id}.jpg`,
      contentType: entry.blob.type || "image/jpeg",
      size: entry.blob.size,
    }),
  });
  if (!presignRes.ok) {
    throw new Error(`presign ${presignRes.status}`);
  }
  const presign = (await presignRes.json()) as PresignUploadOutput;

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": entry.blob.type || "image/jpeg" },
    body: entry.blob,
  });
  if (!putRes.ok) {
    throw new Error(`upload ${putRes.status}`);
  }

  const createRes = await fetch(`${env.API_URL}/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Token": token,
    },
    body: JSON.stringify({
      type: entry.type,
      aiStyle: entry.aiStyle ?? "none",
      objectKey: presign.objectKey,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`create ${createRes.status}`);
  }
  return presign.photoId;
}