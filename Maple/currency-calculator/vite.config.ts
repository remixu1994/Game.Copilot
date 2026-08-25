import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/Game.Copilot/' : '/',
  cacheDir: './.vite-cache',
  plugins: [react()],
}));
