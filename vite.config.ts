import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { silenceDeprecations: ['legacy-js-api'] },
    },
  },
  resolve: {
    alias: {
      '@frontend': resolve(__dirname, 'src/frontend'),
      '@backend': resolve(__dirname, 'src/backend'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
