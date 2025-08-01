import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the basketball mini‑game.
// We enable the React plugin to support JSX and fast refresh.
export default defineConfig({
  plugins: [react()],
  // The `base` option controls the base path for deployed assets.  When
  // deploying to Netlify or GitHub Pages you typically leave this as `/`.
  base: '/',
});