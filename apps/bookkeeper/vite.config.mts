/** @type {import('vite').UserConfig} */
// import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { uiPluginsPlugin } from './src/plugin-server/vite-plugin-ui-plugins'
import 'dotenv/config'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log(`Vite Bookkeeper: PORT = ${JSON.stringify(env.PORT)}`)
  console.log(`Vite Bookkeeper: UI_API_URL = ${JSON.stringify(env.UI_API_URL)}`)
  return {
    appType: 'spa',
    clearScreen: false,
    build: {
      chunkSizeWarningLimit: 10_000,
    },
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
      uiPluginsPlugin(),
    ],
    base: '/',
    define: {
      __UI_API_URL: JSON.stringify(env.UI_API_URL || 'http://localhost:7204/'),
      global: 'globalThis',
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.PORT || '7204'),
      watch: {
        // In theory this would be good idea but does not work too well, since we lose the track of plugins.
        // ignored: [path.join(__dirname, 'src/Plugins/index.json'), path.join(__dirname, 'src/Plugins/index.jsx')]
      }
    }
  }
})
