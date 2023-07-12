import { KnexDatabase } from '@dataplug/tasenor-common-node'

export async function getSetting(db: KnexDatabase, name: string) {
  const line = await db('settings').where({ name }).first()
  return line ? line.value : undefined
}
