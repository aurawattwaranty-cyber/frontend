import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // Pure logic only — no component rendering, so no DOM environment needed.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
