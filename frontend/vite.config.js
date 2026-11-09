import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend has no CORS setup, so the dev server proxies /api/* to it.
// Override the target with VITE_API_TARGET if the API runs elsewhere.
const target = process.env.VITE_API_TARGET || "http://localhost:8000";

// The shared sample data lives outside this folder. The search module's offline
// fallback imports it directly (instead of keeping its own copies), so it can
// never drift from what the API serves.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@data": `${repoRoot}data`,
      "@mappings": `${repoRoot}mappings`,
    },
  },
  server: {
    port: 5173,
    fs: { allow: [repoRoot] },
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
