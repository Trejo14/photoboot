import { z } from "zod";

const serverEnvSchema = z.object({
  ADMIN_PASSWORD: z.string().min(1),
  ADMIN_KEY: z.string().min(1),
});

let cached: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (!cached) {
    cached = serverEnvSchema.parse({
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_KEY: process.env.ADMIN_KEY,
    });
  }
  return cached;
}
