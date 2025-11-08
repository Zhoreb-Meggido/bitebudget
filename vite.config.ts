import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Base path for GitHub Pages (repo name) - only in production
  base: command === 'build' ? '/bitebudget/' : '/',
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
    copyPublicDir: true,
    rollupOptions: {
      output: {
        // Add timestamp to force new hashes on each build (helpful for cache busting during development)
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },
  // Server configuratie voor development
  server: {
    port: 3000,
    open: true,
    // Force browser cache headers for development
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
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
}))
