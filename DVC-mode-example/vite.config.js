import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/zktls': {
        target: 'http://35.198.243.131:38080/',
        changeOrigin: true,
      }
    }
  },
})
