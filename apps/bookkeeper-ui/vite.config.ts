import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
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
      global: 'globalThis'
    },
    server: {
      port: parseInt(env.PORT || '7204')
    }
  }
})
