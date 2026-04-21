import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './frontend/src/test/setupTests.js',
    include: ['frontend/src/**/*.test.{js,jsx}'],
    globals: true,
    css: true,
    testTimeout: 10000,
  },
})
