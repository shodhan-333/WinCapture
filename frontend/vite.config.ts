import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,

    proxy: {
      "/api": {
        target: process.env.API_DEV_SERVER_URL || "https://localhost:7106",
        changeOrigin: true,
        secure: false,
      },
      // Route the Angular app's /angular path to its separate local dev server.
      "/angular": {
        target: process.env.ANGULAR_DEV_SERVER_URL || "http://localhost:4200",
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
});
