import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  ADMIN_PASSWORD: z.string().min(1),
  ADMIN_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_KEY: process.env.ADMIN_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
});