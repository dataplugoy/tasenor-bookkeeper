import { ProcessModelData, ID, ProcessModelDetailedData, ProcessStepModelData } from '@dataplug/tasenor-common'
import { KnexDatabase } from '../database'

export type ProcessApi = {
  process: {
    getAll: () => Promise<ProcessModelData[]>,
    get: (id: ID) => Promise<ProcessModelDetailedData>
    getStep: (id: ID, step: number) => Promise<ProcessStepModelData>
  }
}

/**
 * Data query API for processes.
 * @param db
 * @returns
 */
export default function(db: KnexDatabase): ProcessApi {
  return {
    process: {
      getAll: async (): Promise<ProcessModelData[]> => {
        return db('processes').select('*').orderBy('created', 'desc')
      },
      get: async (id: ID): Promise<ProcessModelDetailedData> => {
        const data = await db('processes').select('*').where({ id }).first()
        if (data) {
          const steps = await db('process_steps').select('id', 'action', 'directions', 'number', 'started', 'finished').where({ processId: id }).orderBy('number')
          data.steps = steps || []
        }
        return data
      },
      getStep: async (id: ID, number: number): Promise<ProcessStepModelData> => {
        const data = await db('process_steps').select('*').where({ processId: id, number }).first()
        return data
      }
    }
  }
}
