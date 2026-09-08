import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // The assignment's rubric names public env vars with a NEXT_PUBLIC_ prefix (a Next.js
  // convention); accepting that prefix alongside Vite's own lets .env.example use the
  // literal required names while still working correctly in this Vite app.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
