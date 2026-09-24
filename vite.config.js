import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In production the dashboard is served by a Hyperwatch process under
// /dashboard and calls its API on bare paths. In development, everything
// outside /dashboard (and Vite's own paths) is proxied to that process,
// WebSockets included (/logs/<node>).
const target = process.env.HYPERWATCH_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/dashboard',
  server: {
    proxy: {
      '^/(?!dashboard(/|$)|@|src/|node_modules/)': { target, ws: true },
    },
  },
});
