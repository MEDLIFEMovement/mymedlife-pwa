import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    coverage: {
      // Copied Figma shells are visual contract code; render/source-map tests cover
      // their presence while coverage stays focused on app logic and services.
      exclude: ["src/components/figma-*.tsx"],
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "lcov"],
    },
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**", "dist/**"],
    globals: false,
  },
});
