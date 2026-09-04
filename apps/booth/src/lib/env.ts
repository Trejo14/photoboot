import { z } from "zod";

const envSchema = z.object({
  API_URL: z.string().url().default("http://localhost:4000"),
  GALLERY_URL: z.string().url().default("http://localhost:3003"),
  BIRDCAM_ENV: z.enum(["development", "production"]).default("production"),
});

const parsed = envSchema.parse({
  API_URL: import.meta.env.VITE_API_URL,
  GALLERY_URL: import.meta.env.VITE_GALLERY_URL,
  BIRDCAM_ENV: import.meta.env.VITE_BIRDCAM_ENV,
});

export const env = {
  ...parsed,
  IS_DEV: parsed.BIRDCAM_ENV === "development",
};