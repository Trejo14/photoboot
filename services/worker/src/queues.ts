import { Queue, QueueEvents } from "bullmq";
import { env } from "./env";

export const AI_JOBS_QUEUE = "ai-photo-jobs";

export const connection = { url: env.REDIS_URL };

export const aiPhotoQueue = new Queue(AI_JOBS_QUEUE, { connection });
export const aiPhotoQueueEvents = new QueueEvents(AI_JOBS_QUEUE, { connection });
