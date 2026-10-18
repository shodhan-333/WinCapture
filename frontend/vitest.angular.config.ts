import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const angularRoot = path.resolve(frontendRoot, "../frontend-angular");

export default defineConfig({
  root: angularRoot,
  resolve: {
    alias: [
      {
        find: "@angular/common/http",
        replacement: path.resolve(angularRoot, "node_modules/@angular/common/fesm2022/http.mjs"),
      },
      {
        find: "@angular/core",
        replacement: path.resolve(angularRoot, "node_modules/@angular/core/fesm2022/core.mjs"),
      },
      {
        find: "@angular/compiler",
        replacement: path.resolve(angularRoot, "node_modules/@angular/compiler/fesm2022/compiler.mjs"),
      },
      {
        find: /^(@angular\/[^/]+|@azure\/[^/]+|rxjs)$/,
        replacement: path.resolve(angularRoot, "node_modules/$1"),
      },
      {
        find: /^(?![./]|[A-Za-z]:[\\/])(@[^/]+\/[^/]+|[^/]+)(\/.*)?$/,
        replacement: path.resolve(frontendRoot, "node_modules/$1$2"),
      },
    ],
  },
  server: { fs: { allow: [".."] } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    pool: "threads",
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: path.resolve(frontendRoot, "../Tests/angular.Tests/TestResults"),
      include: ["src/app/**/*.ts"],
      exclude: [
        "src/app/core/models.ts",
        "src/app/app.config.ts",
        "src/app/core/auth/msal.config.ts",
      ],
    },
  },
});
