import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_DOWNLOAD_URL: z.string().url().default("http://localhost:4000/download"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  NEXT_PUBLIC_DOWNLOAD_URL: process.env.NEXT_PUBLIC_DOWNLOAD_URL,
});