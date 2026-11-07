import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxy = {
  '/api': {
    target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true, proxy },
  preview: { proxy },
})
