import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/*.test.*",
      "**/__tests__/**",
      "**/*.d.ts",
      "src/types/**",
      "jest.setup.js",
      "jest.config.js",
      "babel.config.js",
      "next.config.js"
    ]
  }
];

export default eslintConfig;
