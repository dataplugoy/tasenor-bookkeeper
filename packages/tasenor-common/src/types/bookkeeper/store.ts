import { AccountModel, AccountNumber, BalanceModel, DatabaseModel, EntryModel, ImporterModel, PeriodModel } from "."
import { TasenorSetup } from "../../risp"
import { Catalog } from "./catalog"

/**
 * A Mobx store for keeping all currently loaded data in memory.
 */
 export declare class Store {
  db: string
  accounts: AccountModel[]
  database: DatabaseModel
  dbsByName: Record<string, DatabaseModel>
  catalog: Catalog
  periodId: number | null
  period?: PeriodModel

  updateSettings(db: string | null, values: Record<string, unknown>): Promise<void>
  addError(text:string): void
  addMessage(text:string): void
  fetchImporter(db, importerId): Promise<ImporterModel>
  deleteDocument(doc): Promise<BalanceModel[]>
  getDocuments(accounts?: AccountNumber[], filter?: (e: EntryModel) => boolean)
  fetchBalances(db?: string, periodId?: number): Promise<void>
  fetchDocuments(db?: string, periodId?: number): Promise<void>
  request(path, method?: string, data?: unknown, file?: unknown, noDimming?: boolean): Promise<unknown>
  rispSetup(baseUrl: string): TasenorSetup
}
