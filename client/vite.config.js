import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    global: 'globalThis', // Polyfill for global
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
});
