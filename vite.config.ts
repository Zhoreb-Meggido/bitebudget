import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages (repo name)
  base: '/bitebudget/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react()
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    copyPublicDir: true
  },
  // Server configuratie voor development
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy OpenFoodFacts API requests to avoid CORS issues in development
      '/api/openfoodfacts': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts/, ''),
        secure: true,
      }
    }
  }
})
