import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Where the dev server proxies /api to. Defaults to the local Go backend;
// override in frontend/.env.local (not tracked) with:
//   VITE_API_PROXY_TARGET=https://nyumbayangu.online
// to point at the deployed backend instead of running one locally.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  // A unique ID per production build, embedded in the bundle and also written to
  // dist/version.json. The running app polls version.json and prompts a refresh
  // when the two no longer match — see src/components/UpdateBanner.tsx.
  const buildId = String(Date.now())
  const writeVersionFile: Plugin = {
    name: 'write-version-file',
    closeBundle() {
      writeFileSync(resolve(__dirname, 'dist/version.json'), JSON.stringify({ buildId }))
    },
  }

  return {
    plugins: [react(), tailwindcss(), writeVersionFile],
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
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
