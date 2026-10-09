import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^(?![./]|[A-Za-z]:[\\/])(@[^/]+\/[^/]+|[^/]+)(\/.*)?$/,
        replacement: path.resolve(frontendRoot, "node_modules/$1$2"),
      },
    ],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    include: ["../Tests/frontend.Tests/**/*.test.{ts,tsx}"],
    setupFiles: "../Tests/frontend.Tests/setup.ts",
    clearMocks: true,
    restoreMocks: true,
    pool: "threads",
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/types/**", "src/index.css"],
    },
  },
});
