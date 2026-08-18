import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  ADMIN_PASSWORD: z.string().min(1).default("admin123"),
  AUTH_SECRET: z.string().min(1).default("admin-dev-secret"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  AUTH_SECRET: process.env.AUTH_SECRET,
});