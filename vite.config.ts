import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define process for browser compatibility
    'process.env': {},
    'global': 'globalThis',
  },
  optimizeDeps: {
    exclude: ['googleapis'] // Exclude googleapis from optimization
  }
})