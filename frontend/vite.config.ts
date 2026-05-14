import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: ['sevdailematematik.com', 'www.sevdailematematik.com'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:5005',
        changeOrigin: true,
      },
    },
    // Windows host + Docker volume mount: filesystem events don't propagate,
    // so Vite must poll for changes instead of relying on inotify.
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
})
