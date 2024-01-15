import { AssetTransfer, Currency, Email, Language, LoginPluginData, ReportID, ReportOptions, TokenPair, TsvFilePath } from '..'
import { ALL } from '../..'
import { TasenorPlugin, PluginCode, BackendPlugin, SchemePlugin, ReportPlugin, ServicePlugin } from '../plugins'

/**
 * Catalog hooks for backend.
 */
export type CatalogHookAfterLogin = (email: Email, tokens: TokenPair) => Promise<TokenPair & Record<string, unknown>>
export type CatalogHookRegisterUser = (name: string, email: Email) => Promise<boolean>
export type CatalogHookSubscribe = (email: Email, code: PluginCode) => Promise<LoginPluginData | null>
export type CatalogHookUnsubscribe = (email: Email, code: PluginCode) => Promise<LoginPluginData | null>
export type CatalogHook = CatalogHookRegisterUser | CatalogHookAfterLogin | CatalogHookSubscribe | CatalogHookUnsubscribe
export type CatalogHooks = {
  // TODO: These could be too complicated to have any useful use, that maybe remove them.
  // Keep for now to show how to make hooks in catalog where more useful.
  registerUser: CatalogHookRegisterUser[]
  afterLogin: CatalogHookAfterLogin[]
  subscribe: CatalogHookSubscribe[]
  unsubscribe: CatalogHookUnsubscribe[]
}

export declare class TransactionImportHandler {}

/**
 * An accessor for UI plugin functionality.
 */
export declare class Catalog {

  history: unknown // History component. Redefine where used.

  getCurrencies(): Currency[]
  language(): Language
  money2str(cents: number, currency?: Currency, signed?: boolean): string
  date2str(date: string | number): string
  getImportOptions(): Record<string, TasenorPlugin>
  reset(): void
  load(plugin): BackendPlugin
  reload(): Promise<void>
  find(code: PluginCode): BackendPlugin
  install(code: PluginCode): Promise<void>
  uninstall(code: PluginCode): Promise<void>
  installPluginsToDb(db): Promise<void>
  getTranslations(language?: Language): Record<string, Record<string, string>>
  t(str: string, lang: Language): string
  getSchemePlugin(code: PluginCode): SchemePlugin
  getSchemePaths(code: PluginCode, language): TsvFilePath[] | null
  getSchemeDefaults(code: PluginCode): Record<string, unknown> | null
  getReportIDs(scheme: string | undefined): Promise<Set<ReportID>>
  getReportPlgugin(id: ReportID): ReportPlugin | null
  getReportOptions(id: ReportID): ReportOptions
  getServices(): string[]
  getServiceProviders(service): ServicePlugin[]
  getPluginsIDs(): number[]
  getPluginsWithSettings(): BackendPlugin[]
  getImportHandlers(): TransactionImportHandler[]
  getCommonKnowledge(): Promise<Record<string, unknown>>
  getVAT(time: Date, transfer: AssetTransfer, currency: Currency): Promise<null | number>
  forEach(callback: (plugin: BackendPlugin) => Promise<void>)
  registerHook(name: string, func: CatalogHook): void
  afterLogin(user: Email, tokens: TokenPair): Promise<TokenPair & Record<string, unknown>>
  subscribe(user: Email, code: PluginCode): Promise<LoginPluginData | null>
  unsubscribe(user: Email, code: PluginCode): Promise<LoginPluginData | null>
}

/**
 * An accessor for backend plugin functionality.
 */
export declare class BackendCatalog {
  t(str: string, lang: Language): string
  registerHook(name: string, func: CatalogHook)
  queryBackend(dataSet: string, query: typeof ALL | string): Promise<undefined | unknown>
}
