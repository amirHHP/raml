import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // Production build is embedded into the game app under /admin/
  // Local `vite` still serves at http://localhost:5174/
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, '../frontend/public/admin'),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
