/* eslint-disable @typescript-eslint/no-unused-vars */
import { AccountAddress, AccountNumber, Asset, AssetExchange, AssetTransfer, AssetType, BalanceBookkeeping, Currency, Language, StockValueData, TradeableAsset, ImportState, ProcessConfig, Directions, ID } from '@dataplug/tasenor-common'
import { ImportPlugin, TransactionImportConnector, TransactionImportHandler, ISPDemoServer } from '..'
import { CoinbaseHandler } from '../../../tasenor-common-plugins/src/CoinbaseImport/backend/CoinbaseHandler'
import IncomeAndExpenses from '../../../tasenor-common-plugins/src/IncomeAndExpenses/backend'

/**
 * A connector mock for unit testing.
 */
export class UnitTestImportConnector implements TransactionImportConnector {

  private balance: Record<AccountNumber, number> = {}
  private number: Record<AccountAddress, AccountNumber> = {}

  async initialize(server: ISPDemoServer) {
    //
  }

  addMoney(address: AccountAddress, number: AccountNumber, amount: number) {
    this.balance[address] = (this.balance[address] || 0) + amount
    this.number[address] = number
  }

  async initializeBalances(time: Date, balances: BalanceBookkeeping, config: ProcessConfig): Promise<void> {
    balances.configureNames(config)
    Object.keys(this.balance).forEach(address => balances.set(this.number[address], this.balance[address]))
  }

  async getAccountCanditates(): Promise<AccountNumber[]> {
    return []
  }

  async getStock(time: Date, account: AccountNumber, symbol: TradeableAsset): Promise<StockValueData> {
    return {
      amount: 0,
      value: 0
    }
  }

  async getVAT(time: Date, transfer: AssetTransfer, currency: Currency): Promise<null | number> {
    return null
  }

  async getRate(time: Date, type: AssetType, asset: Asset, currency: Currency, exchange: AssetExchange|null = null): Promise<number> {
    return 1.0
  }

  async getTranslation(text: string, language: string): Promise<string> {
    // Borrow a plugins to get some translations.
    const plugin = new ImportPlugin(new CoinbaseHandler() as unknown as TransactionImportHandler)
    const ret = plugin.t(text, language as Language)
    if (ret !== text) {
      return ret
    }
    const IEplugin = new IncomeAndExpenses()
    return IEplugin.t(text, language as Language)
  }

  async applyResult(): Promise<Record<string, unknown>> {
    return {}
  }

  async resultExists(processId: ID, args: unknown): Promise<boolean> {
    return false
  }

  async success(res: ImportState) {
    //
  }

  async fail(res: ImportState) {
    //
  }

  async waiting(res: ImportState, directions: Directions) {
    //
  }

  async run(): Promise<void> {
    //
  }

  async rollback(processId: ID): Promise<boolean> {
    return true
  }
}
