/**
 * Tasenor Bookkeeper MCP server over stdio, for a single user on their own machine.
 *
 * Configuration is by environment:
 * - `TASENOR_API` the API base URL (default `http://localhost:7205`)
 * - `TASENOR_REFRESH_TOKEN` a long-lived bookkeeping refresh token, or
 * - `TASENOR_USERNAME` and `TASENOR_PASSWORD` login credentials.
 * - `TASENOR_MCP_READ_ONLY` set to anything leaves out the draft tools.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { BookkeeperApi } from './api'
import { createMcpServer } from './mcp'

async function main (): Promise<void> {
  const api = new BookkeeperApi({
    url: process.env.TASENOR_API || 'http://localhost:7205',
    refreshToken: process.env.TASENOR_REFRESH_TOKEN,
    user: process.env.TASENOR_USERNAME,
    password: process.env.TASENOR_PASSWORD
  })
  const server = createMcpServer(api, { readOnly: !!process.env.TASENOR_MCP_READ_ONLY, source: 'mcp' })
  await server.connect(new StdioServerTransport())
}

main().catch(err => {
  // stdout belongs to the protocol, so diagnostics go to stderr.
  console.error('tasenor-mcp:', err)
  process.exit(1)
})
