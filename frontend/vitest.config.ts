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
    include: ["frontend.Tests/**/*.test.{ts,tsx}"],
    setupFiles: "frontend.Tests/setup.ts",
    clearMocks: true,
    restoreMocks: true,
    pool: "threads",
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: path.resolve(frontendRoot, "frontend.Tests/TestResults"),
      // Keep frontend coverage reports beside this test project.
      clean: false,
      // Count files exercised by unit/component tests; do not add untouched app files to the denominator.
      exclude: ["src/**/*.d.ts", "src/types/**", "src/index.css"],
    },
  },
});
