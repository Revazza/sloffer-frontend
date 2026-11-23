import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Backend API (sloffer-backend, `dotnet run --project src/Sloffer.Api`).
const apiUrl = process.env.SLOFFER_API_URL ?? 'http://localhost:5010'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Browser calls /api/... on the Vite dev server, which forwards to the backend (no CORS needed).
    proxy: {
      '/api': apiUrl,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
