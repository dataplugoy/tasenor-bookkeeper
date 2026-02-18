import { defineConfig } from 'cypress'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { execSync } from 'child_process'

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  allowCypressEnv: false,
  expose: {
    API_URL: process.env.CYPRESS_API_URL || '',
    MODE: process.env.CYPRESS_MODE || '',
  },
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
        uploadDatabase({ filePath, apiUrl, user, password }: { filePath: string, apiUrl: string, user: string, password: string }) {
          return new Promise((resolve, reject) => {
            // Authenticate first.
            const authUrl = new URL(`${apiUrl}/auth`)
            const authData = JSON.stringify({ user, password })
            const authReq = http.request(authUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(authData) },
            }, (authRes) => {
              let body = ''
              authRes.on('data', (chunk: string) => { body += chunk })
              authRes.on('end', () => {
                const token = JSON.parse(body).token
                if (!token) return reject(new Error(`Auth failed: ${body}`))

                // Upload the file using multipart/form-data.
                const fileData = fs.readFileSync(filePath)
                const boundary = '----CypressUploadBoundary' + Date.now()
                const fileName = path.basename(filePath)

                const header = Buffer.from(
                  `--${boundary}\r\n` +
                  `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
                  'Content-Type: application/gzip\r\n\r\n'
                )
                const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
                const payload = Buffer.concat([header, fileData, footer])

                const uploadUrl = new URL(`${apiUrl}/db/upload`)
                const uploadReq = http.request(uploadUrl, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': payload.length,
                  },
                }, (uploadRes) => {
                  if (uploadRes.statusCode === 204) {
                    resolve(null)
                  } else {
                    let respBody = ''
                    uploadRes.on('data', (chunk: string) => { respBody += chunk })
                    uploadRes.on('end', () => reject(new Error(`Upload failed (${uploadRes.statusCode}): ${respBody}`)))
                  }
                })
                uploadReq.on('error', reject)
                uploadReq.write(payload)
                uploadReq.end()
              })
            })
            authReq.on('error', reject)
            authReq.write(authData)
            authReq.end()
          })
        },

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
