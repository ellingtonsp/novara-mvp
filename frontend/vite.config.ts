import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-icons', '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-select', '@radix-ui/react-slot'],
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge']
        }
      }
    },
    // Enable minification
    minify: 'terser',
    // Optimize for production
    target: 'es2015',
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'clsx', 'class-variance-authority']
  },
  // Development server configuration
  server: {
    port: 3000,
    host: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  }
})