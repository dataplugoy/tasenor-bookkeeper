import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const SRC_PATH = path.join(__dirname, 'src', 'Plugins')

/**
 * Helper to check file existence and creating initial content if missing.
 */
function check(fileName, content) {
  const filePath = path.join(SRC_PATH, fileName)
  if (fs.existsSync(filePath)) {
    console.log(`  Found ${fileName}`)
  } else {
    fs.writeFileSync(filePath, content)
    console.log(`  Created ${fileName}`)
  }
}

function initializePlugins() {
  if (!fs.existsSync(SRC_PATH)) {
    console.log(`Creating ${SRC_PATH}...`)
    fs.mkdirSync(SRC_PATH)
  }

  console.log(`Checking ${SRC_PATH} for initial files...`)
  check('index.json', '[]\n')
  check('index.jsx', 'const index = []\n\nexport default index\n')
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  initializePlugins()

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
      UI_API_URL: JSON.stringify(env.UI_API_URL || 'http://localhost:7204/'),
      global: 'globalThis',
    },
    server: {
      port: parseInt(env.PORT || '7204')
    }
  }
})
