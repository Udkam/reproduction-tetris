import { defineConfig } from 'vite';

// Frontend lives in src/web with index.html at the project root.
// In dev we proxy /api to the Fastify backend (npm run dev:server).
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
