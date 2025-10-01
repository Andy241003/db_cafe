import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // API proxy for development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
  define: {
    // Make environment variables available - using import.meta.env instead
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000'),
  }
})
