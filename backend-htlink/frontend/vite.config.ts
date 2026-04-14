import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const normalizeProxyTarget = (rawUrl?: string) => {
  const trimmedUrl = rawUrl?.trim().replace(/\/$/, '');
  if (!trimmedUrl) {
    return 'http://localhost:8000';
  }

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl.replace(/\/api\/v1$/, '');
  }

  if (trimmedUrl.endsWith('/api')) {
    return trimmedUrl.replace(/\/api$/, '');
  }

  return trimmedUrl;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = normalizeProxyTarget(env.VITE_API_URL);
  
  return {
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,  // Enable polling for Docker on Windows
      interval: 2500,    // Poll less often to reduce Docker/WSL overhead
    },
    // API proxy for development
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
}});
