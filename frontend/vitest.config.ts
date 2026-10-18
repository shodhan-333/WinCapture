import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(frontendRoot, "src") },
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
      reportsDirectory: path.resolve(frontendRoot, "../Tests/frontend.Tests/TestResults"),
      // Backend coverage XML can coexist in this shared TestResults directory.
      clean: false,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/types/**", "src/index.css"],
    },
  },
});
