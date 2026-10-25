import { defineConfig } from 'vite';

// Served from https://jamestran1.github.io/covay/ on GitHub Pages.
export default defineConfig({
  base: '/covay/',
  // tfjs-core plus two backends is about 600 kB; fine for a one-page spike.
  build: { target: 'es2022', chunkSizeWarningLimit: 1000 },
});
