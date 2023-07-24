/** @type {import('vite').UserConfig} */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config'

const myPlugin = () => ({
  name: 'configure-server',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        if (req.originalUrl.startsWith('/internal/plugins')) {
          res.setHeader('Content-Type', 'application/json')
          res.end('[]')
          return
        }
        next()
      })
    }
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    appType: 'spa',
    plugins: [
      myPlugin(),
      react({
        babel: {
          plugins: [
            [
              '@babel/plugin-proposal-decorators',
              { loose: true, version: '2022-03' },
            ],
          ]
        }
      }),
    ],
    base: '/',
    define: {
      UI_API_URL: JSON.stringify(env.UI_API_URL || 'http://localhost:7204/'),
      global: 'globalThis',
    },
    server: {
      port: parseInt(env.PORT || '7204')
    }
  }
})
