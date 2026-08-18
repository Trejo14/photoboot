import { aiPhotoQueue, aiPhotoQueueEvents } from "./queues";

async function shutdown() {
  await aiPhotoQueue.close();
  await aiPhotoQueueEvents.close();
  process.exit(0);
}

async function main() {
  console.log(
    "@photobooth/worker online — BullMQ queue 'ai-photo-jobs' ready (IA processors pendientes en Sprint 5-6)."
  );

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void main();
