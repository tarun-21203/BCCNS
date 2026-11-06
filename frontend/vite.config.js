import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend has no CORS setup, so the dev server proxies /api/* to it.
// Override the target with VITE_API_TARGET if the API runs elsewhere.
const target = process.env.VITE_API_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
