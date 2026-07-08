/** @type {import('vite').UserConfig} */
// import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
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
    resolve: {
      // @tasenor/common-ui declares older i18next/react-i18next peer ranges than this app,
      // so pnpm keeps two copies. In the production bundle that means the RISP form
      // components (in common-ui) use a *separate*, uninitialised i18next instance and
      // render translation keys instead of labels ("LABEL SAVE.", "label-canRegister", ...).
      // Force a single shared instance so RISP labels resolve against the app's translations.
      dedupe: ['i18next', 'react-i18next', 'react', 'react-dom'],
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
