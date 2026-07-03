import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "lcov"],
    },
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**", "dist/**"],
    globals: false,
  },
});
