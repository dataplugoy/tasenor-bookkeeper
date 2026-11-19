/**
 * Tasenor Bookkeeper MCP server over stdio.
 *
 * Configuration is by environment:
 * - `TASENOR_API` the API base URL (default `http://localhost:7205`)
 * - `TASENOR_REFRESH_TOKEN` a long-lived bookkeeping refresh token, or
 * - `TASENOR_USERNAME` and `TASENOR_PASSWORD` login credentials.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { BookkeeperApi } from './api'
import { registerTools } from './tools'
import pkg from '../package.json'

async function main (): Promise<void> {
  const api = new BookkeeperApi({
    url: process.env.TASENOR_API || 'http://localhost:7205',
    refreshToken: process.env.TASENOR_REFRESH_TOKEN,
    user: process.env.TASENOR_USERNAME,
    password: process.env.TASENOR_PASSWORD
  })
  const server = new McpServer({ name: 'tasenor-bookkeeper', version: pkg.version }, {
    instructions: 'Read-only access to Tasenor Bookkeeper, a Finnish double-entry bookkeeping system. ' +
      'Start with list_databases and list_periods; most tools need a database name and a period id. ' +
      'All amounts are euros. Account names and entry descriptions are usually in Finnish.'
  })
  registerTools(server, api)
  await server.connect(new StdioServerTransport())
}

main().catch(err => {
  // stdout belongs to the protocol, so diagnostics go to stderr.
  console.error('tasenor-mcp:', err)
  process.exit(1)
})
