// eslint.config.js (ESM flat config, Node + TypeScript)
import js from "@eslint/js"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"
import process from "node:process" // ✅ Import process explicitly

export default [
  // Base recommended JavaScript rules
  js.configs.recommended,

  // Our project-specific overrides
  {
    ignores: ["dist", "node_modules"],
    files: ["src/**/*.{ts,js}"],
    languageOptions: {
      parser: tsParser, // ✅ actual parser object
      parserOptions: {
        project: "./tsconfig.server.json",
        tsconfigRootDir: process.cwd(), // ✅ now works fine
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // --- Basic JS / style rules ---
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      quotes: ["error", "double"],

      // --- TypeScript rules ---
      "no-unused-vars": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-misused-promises": ["error"],

      // --- Node specific ---
      "no-process-exit": "warn",
      "no-console": "off",
    },
  },
]
