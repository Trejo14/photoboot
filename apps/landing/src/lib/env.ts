import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_BOOTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default("http://localhost:3001"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_BOOTH_URL: process.env.NEXT_PUBLIC_BOOTH_URL,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
});