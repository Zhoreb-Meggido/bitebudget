import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react({
      // React plugin configuratie
      babel: {
        // Babel transformaties voor JSX
      }
    }),
    viteSingleFile({
      // Plugin om alles in één HTML bestand te bundelen
      removeViteModuleLoader: true
    })
  ],
  build: {
    target: 'esnext',
    // Inline alle assets (geen aparte bestanden)
    assetsInlineLimit: 100000000, // 100MB - inline alles
    cssCodeSplit: false,
    // Output configuratie
    outDir: 'dist',
    // Rollup opties voor optimale bundeling
    rollupOptions: {
      output: {
        // Alle imports inline (geen code splitting)
        inlineDynamicImports: true,
        // Single output file
        manualChunks: undefined
      }
    },
    // Minify voor kleinere output
    minify: 'esbuild',
    // Source maps voor development (optioneel)
    sourcemap: false
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
