import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: true,
    exclude: ["node_modules", ".next", "e2e", "**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/domain/**", "src/ai/**", "src/lib/**"],
    },
  },
});
