import { KnexDatabase } from '../database'
import { BackendPlugin } from './BackendPlugin'

/**
 * A generic tool.
 */
export class ToolPlugin extends BackendPlugin {

  /**
   * Handler for GET request.
   */
  async GET(db: KnexDatabase, query): Promise<unknown> {
    return undefined
  }

  /**
   * Handler for DELETE request.
   */
  async DELETE(db: KnexDatabase, query): Promise<unknown> {
    return undefined
  }

  /**
   * Handler for POST request.
   */
  async POST(db: KnexDatabase, data): Promise<unknown> {
    return undefined
  }

  /**
   * Handler for PUT request.
   */
  async PUT(db: KnexDatabase, data): Promise<unknown> {
    return undefined
  }

  /**
   * Handler for PATCH request.
   */
  async PATCH(db: KnexDatabase, data): Promise<unknown> {
    return undefined
  }
}
