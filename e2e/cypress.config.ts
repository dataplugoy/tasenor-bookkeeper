import { defineConfig } from 'cypress'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  e2e: {
    baseUrl: process.env.CYPRESS_URL,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10_000,
    testIsolation: false,
    watchForFileChanges: true,
    taskTimeout: 10_000,
    video: true,
    setupNodeEvents(on, config) {
      on('task', {
        compareTarPackages({ actual, expected }) {
          const tmpDir = path.join(__dirname, 'cypress', 'tmp')
          const actualDir = path.join(tmpDir, 'actual')
          const expectedDir = path.join(tmpDir, 'expected')

          // Clean up
          if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true })
          }
          fs.mkdirSync(actualDir, { recursive: true })
          fs.mkdirSync(expectedDir, { recursive: true })

          // Extract both tar files
          execSync(`tar xf "${actual}" -C "${actualDir}"`)
          execSync(`tar xf "${expected}" -C "${expectedDir}"`)

          // Normalize: remove schemeVersion and databaseId from JSON files
          const normalizeJsonFiles = (dir: string) => {
            const files = fs.readdirSync(dir, { recursive: true }) as string[]
            for (const file of files) {
              const full = path.join(dir, file)
              if (fs.statSync(full).isFile() && full.endsWith('.json')) {
                let content = fs.readFileSync(full, 'utf-8')
                const parsed = JSON.parse(content)
                delete parsed.schemeVersion
                delete parsed.databaseId
                fs.writeFileSync(full, JSON.stringify(parsed, null, 2))
              }
            }
          }

          normalizeJsonFiles(actualDir)
          normalizeJsonFiles(expectedDir)

          // Compare directories
          try {
            execSync(`diff -r "${actualDir}" "${expectedDir}"`)
            return null
          } catch (e) {
            return (e as Error).message || 'Tar packages differ'
          } finally {
            fs.rmSync(tmpDir, { recursive: true })
          }
        },
      })
      return config
    },
  },
})
