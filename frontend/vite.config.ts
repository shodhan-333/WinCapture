import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const requiredValues = [
    ["VITE_FRONTEND_DEV_HOST", env.VITE_FRONTEND_DEV_HOST],
    ["VITE_FRONTEND_DEV_PORT", env.VITE_FRONTEND_DEV_PORT],
    ["VITE_ANGULAR_DEV_SERVER_URL", env.VITE_ANGULAR_DEV_SERVER_URL],
  ] as const;
  const missingValues = requiredValues.filter(([, value]) => !value?.trim());
  if (missingValues.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingValues.map(([key]) => key).join(", ")}`,
    );
  }

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },

  server: {
    host: env.VITE_FRONTEND_DEV_HOST,
    port: Number(env.VITE_FRONTEND_DEV_PORT),
    strictPort: true,

    proxy: {
      // Route the Angular app's /angular path to its separate local dev server.
      "/angular": {
        target: env.VITE_ANGULAR_DEV_SERVER_URL,
        changeOrigin: true,
        ws: true,
      },
    },

    https: {
      key: fs.readFileSync(path.resolve(__dirname, "certs/localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost.pem")),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
  },
  };
});
