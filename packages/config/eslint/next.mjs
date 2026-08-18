import { FlatCompat } from "@eslint/eslintrc";
import base from "./base.mjs";

export function createNextEslintConfig(appDir) {
  const compat = new FlatCompat({ baseDirectory: appDir });

  return [
    ...base,
    ...compat.extends("next/core-web-vitals"),
    ...compat.extends("next/typescript"),
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports" },
        ],
      },
    },
  ];
}
