import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { BookkeeperApi } from './api'
import { ToolOptions, registerTools } from './tools'
import pkg from '../package.json'

/**
 * One MCP server bound to one user's API client, the same for stdio and HTTP.
 */
export function createMcpServer (api: BookkeeperApi, options: ToolOptions = {}): McpServer {
  const server = new McpServer({ name: 'tasenor-bookkeeper', version: pkg.version }, {
    instructions: 'Access to Tasenor Bookkeeper, a Finnish double-entry bookkeeping system. ' +
      'Start with list_databases and list_periods; most tools need a database name and a period id. ' +
      'All amounts are euros. Account names and entry descriptions are usually in Finnish.' +
      (options.readOnly ? '' : ' New documents can only be proposed as drafts with create_draft; a person confirms them in Bookkeeper.')
  })
  registerTools(server, api, options)
  return server
}
