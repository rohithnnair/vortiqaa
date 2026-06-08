import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VITE_DEV_SERVER_URL = env.VITE_DEV_SERVER_URL || 'http://localhost:5177'

  return {
    base: './',
    server: {
      port: 5177,
      strictPort: true,
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
