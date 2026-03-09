import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3220",
      "/ws": {
        target: "ws://localhost:3220",
        ws: true,
      },
    },
  },
});
