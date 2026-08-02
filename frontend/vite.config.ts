import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the dev server proxies /api to. Defaults to the local Go backend;
// override in frontend/.env.local (not tracked) with:
//   VITE_API_PROXY_TARGET=https://nyumbayangu.online
// to point at the deployed backend instead of running one locally.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
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
  }
})
