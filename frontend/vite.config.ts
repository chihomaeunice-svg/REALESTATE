import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the dev server proxies /api to. Defaults to the local Go backend;
// override in frontend/.env.local (not tracked) with:
//   VITE_API_PROXY_TARGET=https://nyumbayangu.online
// to point at the deployed backend instead of running one locally.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
