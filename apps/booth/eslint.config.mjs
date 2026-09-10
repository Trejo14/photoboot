import { createViteEslintConfig } from "@photobooth/config/eslint/vite";

export default [
  ...createViteEslintConfig(),
  {
    // Node build-time script, not part of the browser app bundle.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
];