import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});