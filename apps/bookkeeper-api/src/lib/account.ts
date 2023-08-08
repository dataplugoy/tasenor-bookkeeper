import { KnexDatabase } from '@tasenor/common-node'

export async function suspenseAccount(db: KnexDatabase) {
  return await db('account').select('*').whereRaw("data->>'code' = 'SUSPENSE_ACCOUNT'").first()
}
