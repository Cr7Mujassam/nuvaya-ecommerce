import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
    },
  },
});
