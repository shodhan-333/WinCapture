import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,

    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "certs/localhost-key.pem")
      ),
      cert: fs.readFileSync(
        path.resolve(__dirname, "certs/localhost.pem")
      ),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
  },
});