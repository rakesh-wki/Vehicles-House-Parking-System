import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// No proxy: the backend has no /api prefix, so axios calls
// http://localhost:5001 directly (see src/lib/api.js).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
