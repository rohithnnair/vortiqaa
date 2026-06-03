import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VITE_DEV_SERVER_URL = env.VITE_DEV_SERVER_URL || 'http://localhost:5174'

  return {
    base: './',
    server: {
      port: 5174,
      strictPort: true,
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
