import { createNextEslintConfig } from "@photobooth/config/eslint/next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export default createNextEslintConfig(dirname(fileURLToPath(import.meta.url)));