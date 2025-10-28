import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills()
  ],
  server: {
    port: 3000,
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'crypto']
  },
  define: {
    global: 'globalThis'
  }
})
