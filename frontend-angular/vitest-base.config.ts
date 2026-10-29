import { defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(projectRoot, "package.json"));
const angularPackages = [
  "@angular/common",
  "@angular/common/http",
  "@angular/common/http/testing",
  "@angular/core",
  "@angular/core/testing",
  "@angular/core/primitives/di",
  "@angular/core/primitives/signals",
  "@angular/forms",
  "@angular/platform-browser",
  "@angular/platform-browser/testing",
  "@angular/router",
  "@azure/msal-angular",
  "@azure/msal-browser",
  "rxjs",
  "rxjs/operators",
];

export default defineConfig({
  resolve: {
    alias: [...angularPackages]
      .sort((left, right) => right.length - left.length)
      .map((specifier) => ({ find: specifier, replacement: require.resolve(specifier) })),
    dedupe: ["@angular/common", "@angular/core", "@angular/forms", "@angular/router", "rxjs"],
  },
  test: {
    environment: "jsdom",
    isolate: false,
    setupFiles: [path.resolve(projectRoot, "vitest.setup.ts")],
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(projectRoot, "angular-frontend.Tests/TestResults"),
    },
  },
});
