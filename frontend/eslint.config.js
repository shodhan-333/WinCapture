import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: [
      "src/**/*.{ts,tsx}",
      "frontend/src/**/*.{ts,tsx}",
      "../Tests/frontend.Tests/**/*.{ts,tsx}",
      "Tests/frontend.Tests/**/*.{ts,tsx}",
    ],
    plugins: { "react-hooks": reactHooks, boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "files-feature", pattern: "src/features/files/**" },
        { type: "albums-feature", pattern: "src/features/albums/**" },
        { type: "auth-feature", pattern: "src/features/auth/**" },
        { type: "dashboard-feature", pattern: "src/features/dashboard/**" },
        { type: "shared", pattern: "src/shared/**" },
        { type: "legacy", pattern: "src/**" },
      ],
      "boundaries/files": [
        { category: "files-entry", pattern: "src/features/files/index.ts" },
        { category: "albums-entry", pattern: "src/features/albums/index.ts" },
        { category: "auth-entry", pattern: "src/features/auth/index.ts" },
        { category: "dashboard-entry", pattern: "src/features/dashboard/index.ts" },
        { category: "files-internal", pattern: "src/features/files/**" },
        { category: "albums-internal", pattern: "src/features/albums/**" },
        { category: "auth-internal", pattern: "src/features/auth/**" },
        { category: "dashboard-internal", pattern: "src/features/dashboard/**" },
      ],
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // Existing fetch/preview effects synchronize async data with component state.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      // Native audio/video files do not include a companion captions track.
      "jsx-a11y/media-has-caption": "off",
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: [
            {
              from: { element: { type: "shared" } },
              disallow: {
                to: {
                  file: {
                    categories: [
                      "files-entry",
                      "albums-entry",
                      "auth-entry",
                      "dashboard-entry",
                      "files-internal",
                      "albums-internal",
                      "auth-internal",
                      "dashboard-internal",
                    ],
                  },
                },
              },
            },
            {
              from: { element: { type: "app" } },
              disallow: {
                to: {
                  file: {
                    categories: [
                      "files-internal",
                      "albums-internal",
                      "auth-internal",
                      "dashboard-internal",
                    ],
                  },
                },
              },
            },
            {
              from: { element: { type: "files-feature" } },
              disallow: {
                to: {
                  file: { categories: ["albums-internal", "auth-internal", "dashboard-internal"] },
                },
              },
            },
            {
              from: { element: { type: "albums-feature" } },
              disallow: {
                to: {
                  file: { categories: ["files-internal", "auth-internal", "dashboard-internal"] },
                },
              },
            },
            {
              from: { element: { type: "auth-feature" } },
              disallow: {
                to: {
                  file: { categories: ["files-internal", "albums-internal", "dashboard-internal"] },
                },
              },
            },
            {
              from: { element: { type: "dashboard-feature" } },
              disallow: {
                to: {
                  file: { categories: ["files-internal", "albums-internal", "auth-internal"] },
                },
              },
            },
          ],
        },
      ],
    },
  },
);
