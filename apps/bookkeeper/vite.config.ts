/** @type {import('vite').UserConfig} */
// import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    appType: 'spa',
    clearScreen: false,
    plugins: [
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
      host: '0.0.0.0',
      port: parseInt(env.PORT || '7204'),
      proxy: {
        '/internal/plugins': {
          target: 'http://localhost:' + (parseInt(env.PORT || '7204') + 2),
          secure: false,
        }
      },
      watch: {
        // In theory this would be good idea but does not work too well, since we lose the track of plugins.
        // ignored: [path.join(__dirname, 'src/Plugins/index.json'), path.join(__dirname, 'src/Plugins/index.jsx')]
      }
    }
  }
})
