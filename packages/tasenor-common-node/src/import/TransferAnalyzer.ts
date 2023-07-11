import clone from 'clone'
import merge from 'merge'
import { sprintf } from 'sprintf-js'
import {
  AccountNumber, Asset, AccountAddress, AssetExchange, AssetTransfer, AssetTransferReason, AssetType,
  Currency, Language, StockValueData, TradeableAsset, Transaction, TransactionDescription, TransactionKind,
  TransactionLine, StockBookkeeping, UIQuery, Tag, VATTarget, IncomeSource, ExpenseSink, isCurrency, TransferNote, isAssetTransferReason, isAssetType, ZERO_CENTS, less, warning, BalanceBookkeeping, realNegative, AdditionalTransferInfo, CryptoCurrency, ImportSegment, ImportStateText, ProcessConfig, SegmentId, TextFileLine
} from '@dataplug/tasenor-common'
import { TransactionImportHandler } from './TransactionImportHandler'
import { isTransactionImportConnector, TransactionImportConnector } from './TransactionImportConnector'
import { TransactionUI } from './TransactionUI'
import { BadState, InvalidFile, NotImplemented, SystemError } from '../error'

/**
 * Check that two set of symbols are the same.
 * @param s1
 * @param s2
 * @returns
 */
function setEqual<T>(s1: Set<T>, s2:Set<T>): boolean {
  if (s1.size !== s2.size) {
    return false
  }
  return new Set([...s1, ...s2]).size === s1.size
}

/**
 * Ensure that an array of symbols is equal to the set of symbols.
 * @param s1
 * @param s2
 * @returns
 */
function setEqualArray<T>(s1: Set<T>, s2:T[]): boolean {
  return setEqual(s1, new Set(s2))
}

/**
 * Helper to build string presentation of a number.
 * @param value Numeric value.
 * @param digits How many digits to have.
 * @param sign If true, add always sign.
 * @returns
 */
function num(value: number, digits: number|null = null, sign = false): string {
  let result: string
  if (digits !== null) {
    result = sprintf(`%.${digits}f`, value)
  } else {
    result = `${value}`
  }
  if (sign && value >= 0) {
    result = `+${result}`
  }
  return result
}

/**
 * ## Transfer Analysis
 *
 * ### Transfer
 *
 * The structure desribing a single part of a transfer is the following:
 * ```json
 * {
 *   "if": "<optional condition>",
 *   "reason": "<reason>",
 *   "type": "<type>",
 *   "asset": "<asset>",
 *   "amount": "<amount>",
 *   "text": "<optional description>"
 *   "questions": {
 *    },
 *   "data": {
 *      <optional additional data>
 *    }
 * }
 * ```
 * Note that every expression is a string. Value to evaluate to `null` has to be given as a string `"null"`.
 *
 * #### Reason
 *
 * The reason component describes the fundamental general background causing the transaction. For example reason
 * can be `expense` or `income`. Some spesific cases are taken seprately due to their nature, which may need
 * different handling. For example `fee` or `dividend` are special cases of those.
 *
 * For more details {@link AssetTransferReason}.
 *
 * #### Type
 *
 * The type of transfer describes either concrete asset class (`stock`, `currency`, `cryptocurrency`) or sometimes
 * more abstract thing like for example `statement` which represent transfer counterpart in the report.
 *
 * For more details {@link AssetType}.
 *
 * #### Asset
 *
 * Asset is the code for denoting the asset itself like currency code or stock ticker. It is also used for
 * other purposes like code denoting income, expense or tax type.
 *
 * Definition is here {@link Asset}.
 *
 * #### Amount
 *
 * The amount is the number of units of the asset transferred. Typically it is measured in default currency but
 * it could be also other currency or crypto currency. These are converted to the default currency during the
 * processing either by using rates information in the transfer itself or by calling external service to find
 * out the value at the transaction date.
 *
 * Special value `null` can be used to denote amount that must be calculated based on the remainder value of
 * all the other transfer parts added together.
 *
 * #### Text
 *
 * By default the explanation is constructed automatically. If one wants to override the description, then the
 * `text` field can be used.
 *
 * #### Questions
 *
 * Questions defined in setup (See {@link TransactionRules}) can be used in a transfer. When we want to determine
 * some aspect of the transaction by using from the user, we can define additional variables mapping the variable
 * names to the question names. Once the questions are answered, the variables are filled with the answers.
 *
 * For example the following sets the variable `type` based on the selection given
 * ```json
 * "questions": {
 *   "type": "Computer purchase"
 * }
 * ```
 *
 * #### Other Fields
 *
 * In addition it may have some special fields:
 * - `if` When this arbitrary expression is given, it is evaluated and if not `true`, entry is skipped.
 * - `data` This field can have optional informative fields of interest displayed by UI. (See {@link AdditionalTransferInfo}.)
 */
export class TransferAnalyzer {

  private handler: TransactionImportHandler
  private config: ProcessConfig
  private stocks: Record<AccountNumber, StockBookkeeping>
  private state: ImportStateText<'classified'>
  private balances: BalanceBookkeeping

  constructor(handler: TransactionImportHandler, config: ProcessConfig, state: ImportStateText<'classified'>) {
    this.handler = handler
    this.config = config
    this.state = state
    this.stocks = {}
    this.balances = new BalanceBookkeeping()
  }

  get UI(): TransactionUI {
    return this.handler.UI
  }

  /**
   * Read the initial balance.
   */
  async initialize(time: Date): Promise<void> {
    await (this.handler.system.connector as unknown as TransactionImportConnector).initializeBalances(time, this.balances, this.config)
  }

  /**
   * Get the summary of the balances.
   */
  getBalances() {
    return this.balances.summary()
  }

  /**
   * Get a single account balance.
   * @param addr
   */
  getBalance(addr: AccountAddress) {
    return this.balances.get(addr)
  }

  /**
   * Update balance.
   * @param txEntry
   * @param name
   * @returns
   */
  applyBalance(txEntry: TransactionLine): number {
    return this.balances.apply(txEntry)
  }

  /**
   * Revert balance.
   * @param txEntry
   * @param name
   * @returns
   */
  revertBalance(txEntry: TransactionLine): number {
    return this.balances.revert(txEntry)
  }

  /**
   * Get the value from the system configuration.
   */
  getConfig(name: string, def: unknown = undefined): unknown {
    if (!this.config[name]) {
      if (def !== undefined) {
        return def
      }
      throw new SystemError(`A variable ${name} is not configured for transfer analyser.`)
    }
    return this.config[name]
  }

  /**
   * Translate a text.
   * @param text
   * @param language
   * @returns
   */
  async getTranslation(text: string): Promise<string> {
    return this.handler.getTranslation(text, this.getConfig('language') as Language)
  }

  /**
   * Collect lines related to the segment.
   * @param segmentId
   */
  getLines(segmentId: SegmentId): TextFileLine[] | null {
    return this.handler.getLines(this.state, segmentId)
  }

  /**
   * Analyse transfers and collect accounts needed.
   * @param transfers
   * @param options.findMissing If given, list missing accounts by their reason and type instead of throwing error.
   * @returns Accounts or list of missing.
   */
  async collectAccounts(segment: ImportSegment, transfers: TransactionDescription, options: { findMissing?: boolean } = { findMissing: false }): Promise<Record<string, AccountNumber> | AccountAddress[]> {

    const missing: AccountAddress[] = []
    const accounts: Record<string, AccountNumber> = {}

    // Gather accounts.
    for (const transfer of transfers.transfers) {
      // Get normal account.
      const account = await this.getAccount(transfer.reason, transfer.type, transfer.asset, segment.id)
      if (account === undefined) {
        if (!options.findMissing) {
          throw new BadState(`Unable to find an account number for ${transfer.reason}.${transfer.type}.${transfer.asset}.`)
        }
        missing.push(`${transfer.reason}.${transfer.type}.${transfer.asset}` as AccountAddress)
        continue
      }
      accounts[`${transfer.reason}.${transfer.type}.${transfer.asset}`] = account as AccountNumber

      // Check short selling accounts.
      if (transfer.reason === 'trade' && transfer.type === 'stock' && this.getConfig('allowShortSelling', false)) {
        const account = await this.getAccount('trade', 'short', transfer.asset, segment.id)
        if (account === undefined) {
          if (!options.findMissing) {
            throw new BadState(`Unable to find an account number for trade.short.${transfer.asset}.`)
          }
          missing.push(`trade.short.${transfer.asset}` as AccountAddress)
        } else {
          accounts[`trade.short.${transfer.asset}`] = account as AccountNumber
        }
        continue
      }
    }

    return options.findMissing ? missing : accounts
  }

  /**
   * Collect some important values needed from transfer and resolve what kind of transfer we have.
   *
   * The following values are resolved:
   * * `kind` - Kind of transfer recognized.
   * * `exchange` - Name of the imporeter.
   * * `name` - Name of the target asset for statement, if relevant.
   * * `takeAmount` - Amount affecting the asset.
   * * `takeAsset` - The name of the asset.
   */
  async collectOtherValues(transfers: TransactionDescription, values: Record<string, string|number>): Promise<Record<string, string|number>> {
    const currency = this.getConfig('currency') as Currency

    // Collect non-fee reasons.
    const primaryReasons = new Set(transfers.transfers
      .filter(t => !['fee'].includes(t.reason))
      .map(t => t.reason)
    )
    // Collect non-fee assets.
    const primaryAssets = new Set(transfers.transfers
      .filter(t => !['fee'].includes(t.reason))
      .map(t => t.type)
    )

    // Verify that both transfer reasons and assets are exactly the required.
    function weHave(reasons: string[], assets: string[]): boolean {
      return setEqualArray(primaryReasons, reasons) && setEqualArray(primaryAssets, assets)
    }
    // Filter entries that have the given reason and any of types and asset if given.
    function entriesHaving(reason: AssetTransferReason, type: AssetType | AssetType[], asset: Asset | null = null) {
      if (typeof (type) === 'string') {
        type = [type]
      }
      return transfers.transfers.filter(
        t => t.reason === reason &&
        type.includes(t.type) &&
        (asset === null || t.asset === asset))
    }

    // Ensure there is exactly one entry with the given specifications. Throw an error otherwise.
    function shouldHaveOne(reason: AssetTransferReason, type: AssetType | AssetType[], asset: Asset | null = null): AssetTransfer {
      const entries = entriesHaving(reason, type, asset)
      if (entries.length < 1) {
        throw new InvalidFile(`Dit not find entries matching ${reason}.${type}.${asset} from ${JSON.stringify(transfers)}`)
      }
      if (entries.length > 1) {
        throw new InvalidFile(`Found too many entries matching ${reason}.${type}.${asset}: ${JSON.stringify(entries)}`)
      }
      return entries[0]
    }

    // Set up basic values.
    values.currency = currency
    values.exchange = this.handler.name.replace(/Import$/, '')
    transfers.transfers.forEach(transfer => {
      if (transfer.data) {
        Object.assign(values, transfer.data)
      }
    })

    // Find the kind.
    let kind: TransactionKind

    if (transfers.transfers.length === 0) {
      kind = 'none'
    } else if (weHave(['trade'], ['currency', 'crypto']) || weHave(['trade'], ['currency', 'stock'])) {
      const moneyEntry = shouldHaveOne('trade', 'currency')
      if (moneyEntry.amount === undefined) {
        throw new SystemError(`Invalid trade transfer amount undefined in ${JSON.stringify(moneyEntry)}.`)
      }
      kind = moneyEntry.amount < 0 ? 'buy' : 'sell'
      const tradeableEntry = shouldHaveOne('trade', ['crypto', 'stock'])
      if (tradeableEntry.amount === undefined) {
        throw new SystemError(`Invalid buy/sell transfer amount undefined in ${JSON.stringify(tradeableEntry)}.`)
      }
      // TODO: We should get rid of this and handle it in asset valuation always.
      values.takeAmount = num(tradeableEntry.amount, null, true)
      values.takeAsset = tradeableEntry.asset
    } else if (weHave(['trade'], ['crypto']) || weHave(['trade'], ['stock'])) {
      kind = 'trade'
    } else if (weHave(['trade'], ['currency', 'short'])) {
      if (!values.kind) throw new BadState(`Kind is not defined in values for short trade ${JSON.stringify(transfers.transfers)}.`)
      // Kind has been set.
      kind = values.kind as TransactionKind
    } else if (weHave(['forex'], ['currency']) || weHave(['forex', 'income'], ['currency', 'statement']) || weHave(['forex', 'expense'], ['currency', 'statement'])) {
      kind = 'forex'
      const myEntry = transfers.transfers.filter(a => a.reason === 'forex' && a.type === 'currency' && a.asset === currency)
      if (myEntry.length === 0) {
        throw new SystemError(`Cannot find transfer of currency ${currency} from ${JSON.stringify(myEntry)}.`)
      }
      if (myEntry.length > 1) {
        throw new SystemError(`Too many transfers of currency ${currency} in ${JSON.stringify(myEntry)}.`)
      }
      if (myEntry[0].amount === undefined) {
        throw new SystemError(`Invalid forex transfer amount undefined in ${JSON.stringify(myEntry)}.`)
      }
      const otherEntry = transfers.transfers.filter(a => a.reason === 'forex' && a.type === 'currency' && a.asset !== currency)
      if (myEntry.length === 0) {
        throw new SystemError(`Cannot find transfer of currency not ${currency} from ${JSON.stringify(myEntry)}.`)
      }
      if (myEntry.length > 1) {
        throw new SystemError(`Too many transfers of currency not ${currency} in ${JSON.stringify(myEntry)}.`)
      }
      if (otherEntry[0].amount === undefined) {
        throw new SystemError(`Invalid forex transfer amount undefined in ${JSON.stringify(otherEntry)}.`)
      }
      // TODO: We should get rid of this and handle it in asset valuation always.
      values.takeAsset = myEntry[0].amount < 0 ? otherEntry[0].asset : myEntry[0].asset
      values.giveAsset = myEntry[0].amount < 0 ? myEntry[0].asset : otherEntry[0].asset
    } else if (weHave(['dividend', 'income'], ['currency', 'statement']) || weHave(['tax', 'dividend', 'income'], ['currency', 'statement'])) {
      kind = 'dividend'
    } else if (weHave(['income'], ['currency', 'statement']) || weHave(['income', 'tax'], ['currency', 'statement'])) {
      kind = 'income'
      const statementEntry = shouldHaveOne('income', 'statement')
      values.name = await this.getTranslation(`income-${statementEntry.asset}`)
    } else if (weHave(['income'], ['account'])) {
      kind = 'income'
      const texts = transfers.transfers.filter(tr => tr.type === 'account' && tr.data && tr.data.text !== undefined).map(tr => tr.data?.text)
      if (!texts.length) {
        throw new SystemError(`If transfer uses direct 'account' type, one of the parts must have text defined in data: ${JSON.stringify(transfers.transfers)}`)
      }
      values.name = texts.join(' ')
    } else if (weHave(['investment'], ['currency', 'statement'])) {
      kind = 'investment'
      const statementEntry = shouldHaveOne('investment', 'statement')
      values.name = await this.getTranslation(`income-${statementEntry.asset}`)
    } else if (weHave(['expense'], ['currency', 'statement']) || weHave(['expense', 'tax'], ['currency', 'statement'])) {
      kind = 'expense'
      const statementEntry = shouldHaveOne('expense', 'statement')
      values.name = await this.getTranslation(`expense-${statementEntry.asset}`)
    } else if (weHave(['expense'], ['account'])) {
      kind = 'expense'
      const texts = transfers.transfers.filter(tr => tr.type === 'account' && tr.data && tr.data.text !== undefined).map(tr => tr.data?.text)
      if (!texts.length) {
        throw new SystemError(`If transfer uses direct 'account' type, one of the parts must have text defined in data: ${JSON.stringify(transfers.transfers)}`)
      }
      values.name = texts.join(' ')
    } else if (weHave(['distribution'], ['currency', 'statement'])) {
      kind = 'distribution'
      const statementEntry = shouldHaveOne('distribution', 'statement')
      values.name = await this.getTranslation(`expense-${statementEntry.asset}`)
    } else if (weHave(['tax'], ['currency', 'statement'])) {
      kind = 'tax'
      const statementEntry = shouldHaveOne('tax', 'statement')
      values.name = await this.getTranslation(`tax-${statementEntry.asset}`)
    } else if (weHave(['deposit'], ['currency', 'external'])) {
      kind = 'deposit'
      const moneyEntry = shouldHaveOne('deposit', 'currency', currency)
      if (moneyEntry.amount === undefined) {
        throw new SystemError(`Invalid deposit transfer amount undefined in ${JSON.stringify(moneyEntry)}.`)
      }
    } else if (weHave(['withdrawal'], ['currency', 'external'])) {
      kind = 'withdrawal'
      const moneyEntry = shouldHaveOne('withdrawal', 'currency', currency)
      if (moneyEntry.amount === undefined) {
        throw new SystemError(`Invalid withdrawal transfer amount undefined in ${JSON.stringify(moneyEntry)}.`)
      }
    } else if (weHave(['transfer'], ['currency', 'external'])) {
      kind = 'transfer'
      const moneyEntry = shouldHaveOne('transfer', 'currency', currency)
      if (moneyEntry.amount === undefined) {
        throw new SystemError(`Invalid transfer amount undefined in ${JSON.stringify(moneyEntry)}.`)
      }
      const externalEntry = shouldHaveOne('transfer', 'external')
      values.service = externalEntry.asset
    } else if (weHave(['correction'], ['currency', 'statement']) || weHave(['tax', 'correction'], ['currency', 'statement']) || weHave(['tax', 'correction'], ['statement'])) {
      kind = 'correction'
      const assets = transfers.transfers.filter(t => t.reason !== 'tax' && t.type === 'statement').reduce((prev, cur) => prev.add(cur.asset), new Set())
      if (assets.size > 1) {
        throw new SystemError(`Mixed asset ${[...assets].join(' and ')} corrections not supported in ${JSON.stringify(transfers.transfers)}`)
      }
      if (!assets.size) {
        throw new SystemError(`Cannot find any statement types in ${JSON.stringify(transfers.transfers)}`)
      }
      const assetName = assets.values().next().value
      if (/^INCOME/.test(assetName)) {
        values.name = await this.getTranslation(`income-${assetName}`)
      } else {
        values.name = await this.getTranslation(`expense-${assetName}`)
      }
    } else {
      console.log('Failing transfers:')
      console.dir(transfers, { depth: null })
      throw new NotImplemented(`Analyzer does not handle combination '${[...primaryReasons]}' and '${[...primaryAssets]}' yet.`)
    }

    values.kind = kind

    return values
  }

  /**
   * Helper to set values in data field.
   * @param transfer
   * @param values
   */
  setData(transfer, values): void {
    if (!transfer.data) {
      transfer.data = {}
    }
    Object.assign(transfer.data, values)
  }

  /**
   * Helper to set rate in data field.
   * @param transfer
   * @param asset
   * @param rate
   */
  setRate(transfer, asset, rate): void {
    if (!transfer.data) {
      transfer.data = {}
    }
    if (!transfer.data.rates) {
      transfer.data.rates = {}
    }
    transfer.data.rates[asset] = rate
  }

  /**
   * Helper to either get asset rate from data directly or ask from elsewhere.
   * @param time
   * @param transfer
   * @param type
   * @param asset
   */
  async getRate(time: Date, transfer: AssetTransfer, type: AssetType, asset: Asset): Promise<number> {
    if (transfer.data && transfer.data.rates && transfer.data.rates[asset] !== undefined) {
      if (transfer.data.rates[asset] !== undefined) {
        const rate: number | undefined = transfer.data.rates[asset]
        // Compiler fooling.
        if (rate !== undefined) {
          return rate
        }
      }
    }
    return await this.getRateAt(time, type, asset)
  }

  /**
     * Check if rate needs to be fetched and updates it, if needed. Calculate the value.
     * @param time
     * @param transfer
     * @param type
     * @param asset
     */
  async setValue(time: Date, transfer: AssetTransfer, type: AssetType, asset: Asset, amount: number | null = null): Promise<void> {
    const currency = this.getConfig('currency') as Currency
    if (amount === null) {
      // If there is no amount in transfer, postpone resolving value.
      if (transfer.amount === null || transfer.amount === undefined) {
        return
      }
      amount = transfer.amount
    }

    if ((type === 'currency' && asset === currency) || type === 'account') {
      transfer.value = Math.round((amount || 0) * 100)
    } else {
      const rate = await this.getRate(time, transfer, type, asset)
      transfer.value = Math.round(rate * (amount || 0) * 100)
      this.setRate(transfer, asset, rate)
      if (type === 'currency' && isCurrency(transfer.asset)) {
        this.setData(transfer, {
          currency: transfer.asset,
          currencyValue: Math.round((amount || 0) * 100)
        })
      }
    }
  }

  /**
   * Find local currency entries and valueate them trivially.
   * @param time
   * @param transfers
   */
  async fillInLocalCurrencies(time: Date, transfers: TransactionDescription) {
    // Main currency of the database.
    const currency = this.getConfig('currency') as Currency

    // Fill in trivial values for local currency assets.
    for (const transfer of transfers.transfers) {
      if ((transfer.type === 'account' || (transfer.type === 'currency' && transfer.asset === currency)) && transfer.amount !== null) {
        await this.setValue(time, transfer, transfer.type, transfer.asset)
      }
    }
  }

  /**
   * Find currency entries and valueate them.
   * @param time
   * @param transfers
   */
  async fillInCurrencies(time: Date, transfers: TransactionDescription) {
    for (const transfer of transfers.transfers) {
      if (transfer.value) continue
      if (transfer.amount === null) continue
      if (transfer.type === 'currency' && isCurrency(transfer.asset)) {
        await this.setValue(time, transfer, transfer.type, transfer.asset)
      } else if (transfer.data && transfer.data.currency && isCurrency(transfer.data.currency) && transfer.data.currencyValue) {
        await this.setValue(time, transfer, 'currency', transfer.data.currency, transfer.data.currencyValue / 100)
      } else if (transfer.type === 'currency') {
        throw new SystemError(`Cannot determine currency in ${JSON.stringify(transfer)}.`)
      }
    }
  }

  /**
   * Check and fill the last unknown value, if only one left.
   * @param canDeduct - If set to false, just check and do not fill.
   * @returns
   */
  fillLastMissing(transfers: AssetTransfer[], canDeduct: boolean): boolean {
    // Single transfer has to define the value itself.
    if (transfers.length === 1) {
      return transfers[0].value !== null && transfers[0].value !== undefined
    }

    let total = 0
    let unknown: AssetTransfer | null = null
    for (const transfer of transfers) {
      if (transfer.value === null || transfer.value === undefined) {
        if (unknown === null && canDeduct) {
          // First unknown is okay.
          unknown = transfer
        } else {
          // More than one is too much. Give up.
          return false
        }
      } else {
        // Collect total.
        total += transfer.value
      }
    }
    // Weather or not we have any unknowns, we done.
    // Note that validity of total === 0 is checked elsewhere.
    if (unknown) {
      unknown.value = -total
      // Put the amount also, if missing and it matches the value.
      if ((unknown.reason === 'income' || unknown.reason === 'expense') && unknown.type === 'statement' && unknown.amount === null) {
        unknown.amount = -(total / 100)
      }
    }
    return true
  }

  /**
   * Look for all missing asset values and fill them in as system currency to transfer list and values list.
   *
   * May fill the following values:
   *
   * * `giveAmount` - Amount used the other given away if any.
   * * `giveAsset` - Name of the other asset given away if any.
   * * `takeAmount` - Amount  the other asset received if any.
   * * `takeAsset` - Name of the other asset received if any.
   * * `data.currency` - The original currency used, if different than default.
   * * `data.currencyValue` - Value in original currency used, if different than default.
   *
   * For transfers, the following values may be filled:
   *
   * * `value` - Value in the system default currency.
   * * `rates` - Asset value rates vs. the system currency used in conversion.
   *
   * @param transfers
   * @param values
   * @param segment
   * @param config
   */
  async calculateAssetValues(transfers: TransactionDescription, segment: ImportSegment): Promise<Record<string, string|number>> {
    const values: Record<string, string|number> = {}

    // Check if we are allowed to fill in nulls, i.e anything but trading our assets.
    const hasNonCurrencyTrades = transfers.transfers.some(t => t.reason === 'trade' && t.type !== 'account' && t.type !== 'currency' && t.amount && t.amount < 0)
    const needFullScan = transfers.transfers.every(t => t.value !== undefined)
    let closingShortPosition = false
    let canDeduct = !hasNonCurrencyTrades

    // Check if we are closing short positions.
    for (const transfer of transfers.transfers) {
      if (transfer.reason === 'trade' && transfer.type === 'stock') {
        const transferAmount = transfer.amount || 0
        const { amount } = await this.getStock(segment.time, transfer.type, transfer.asset)
        if (amount < 0 && transferAmount > 0) {
          closingShortPosition = true
          canDeduct = false
          break
        }
      }
    }

    // Validate transfers.
    for (const transfer of transfers.transfers) {
      // Allow explicit currency data.
      if (transfer.data && transfer.data.currency !== undefined && transfer.data.currencyValue !== undefined) {
        continue
      }
      // Check invalid amount.
      if (transfer.amount === undefined) {
        throw new SystemError(`Invalid transfer amount undefined in ${JSON.stringify(transfer)}. Please use amount="null" to denote value that needs to be calculated.`)
      }
      // Check invalid reason.
      if (!isAssetTransferReason(transfer.reason)) {
        throw new SystemError(`Invalid transfer reason ${JSON.stringify(transfer.reason)} in ${JSON.stringify(transfer)}.`)
      }
      // Check invalid type.
      if (!isAssetType(transfer.type)) {
        throw new SystemError(`Invalid transfer type ${JSON.stringify(transfer.type)} in ${JSON.stringify(transfer)}.`)
      }
      // TODO: Check if rates are strings and convert. Or even better, throw an error and find the source?
    }

    // Calculate currency values.
    await this.fillInLocalCurrencies(segment.time, transfers)
    if (!needFullScan && this.fillLastMissing(transfers.transfers, canDeduct)) return values

    await this.fillInCurrencies(segment.time, transfers)
    if (!needFullScan && this.fillLastMissing(transfers.transfers, canDeduct)) return values

    // Fill in currency values hidden inside data for some special cases.
    for (const transfer of transfers.transfers) {
      if (transfer.value === undefined && transfer.reason === 'tax') {
        const taxCurrency = transfer?.data?.currency
        if (!taxCurrency) {
          throw new SystemError(`A currency must be defined in data for ${transfer.reason} transfers in ${JSON.stringify(transfer)}.`)
        }
        await this.setValue(segment.time, transfer, 'currency', taxCurrency)
      }
    }
    if (!needFullScan && this.fillLastMissing(transfers.transfers, canDeduct)) return values

    // Fill in fees and dividends in whatever unit they have been determined.
    for (const transfer of transfers.transfers) {
      if (transfer.value === undefined && (transfer.reason === 'fee' || transfer.reason === 'dividend')) {
        await this.setValue(segment.time, transfer, transfer.type, transfer.asset)
      }
    }
    if (!needFullScan && this.fillLastMissing(transfers.transfers, canDeduct)) return values

    // Handle trades.
    for (const transfer of transfers.transfers) {
      if (transfer.reason === 'trade') {
        const transferAmount = transfer.amount || 0
        // SELLING or GIVING
        if (transferAmount <= 0) {
          // If value is already calculated, use it.
          if (transfer.value !== undefined) {
            transfer.value = Math.round(transfer.value || 0)
          } else {
            const { value, amount } = await this.getStock(segment.time, transfer.type, transfer.asset)
            if (less(amount, -transferAmount)) {
              // We hit this on first iteration. After that it should be sorted out.
              // Ot at least pass through to the short selling question.
              const renamed = await this.UI.askedRenamingOrThrow(this.config, segment, transfer.type, transfer.asset)
              if (renamed === true) {
                throw new SystemError(`Something went wrong. Asset ${transfer.type} ${transfer.asset} has been renamed but we did not encounter actual transaction for the renaming.`)
              }
            }
            if (less(amount, -transferAmount)) {
              // Handle short selling.
              const shortOk = await this.UI.getBoolean(this.config, 'allowShortSelling', 'Do we allow short selling of assets?')
              if (!shortOk) {
                throw new SystemError(`We have ${amount} assets ${transfer.asset} in stock for trading on ${segment.time} when ${-transferAmount} needed.`)
              }
              if (amount > 0) {
                throw new NotImplemented(`Cannot handle mix of short selling and normal selling ${transferAmount} ${transfer.asset} on ${segment.time} and having ${amount}.`)
              }
              transfer.type = 'short'
              values.kind = 'short-sell'
              transfer.value = -transfers.transfers.filter(t => t.value && t.value > 0 && t.type === 'currency').reduce((prev, cur) => prev + ((cur && cur.value) || 0), 0)
            } else {
              // Normal selling is valued by the value of the asset in our stock.
              transfer.value = Math.round(transferAmount * (value / amount))
              if (!transfer.value) {
                throw new SystemError(`Asset ${transfer.type} ${transfer.asset} have no value left when trading on ${segment.time}.`)
              }
            }
          }
          values.giveAmount = num(transferAmount, null, true)
          values.giveAsset = transfer.asset
        } else {
          // BUYING or RECEIVING
          if (closingShortPosition) {
            const { value, amount } = await this.getStock(segment.time, transfer.type, transfer.asset)
            // Valuation comes from the short selling price.
            transfer.value = Math.round(transferAmount * (value / amount))
            transfer.type = 'short'
            values.kind = 'short-buy'
          } else {
            // Get the value for stuff traded in from the rate.
            if (transfer.value === undefined) {
              const rate = await this.getRate(segment.time, transfer, transfer.type, transfer.asset)
              transfer.value = Math.round(rate * transferAmount * 100)
              this.setRate(transfer, transfer.asset, rate)
            } else {
              transfer.value = Math.round(transfer.value || 0)
            }
          }
          values.takeAmount = num(transferAmount, null, true)
          values.takeAsset = transfer.asset
        }
      }
    }

    // Try to sort out some more complex cases.
    if (canDeduct) {
      await this.handleMultipleMissingValues(transfers)
    }

    if (!this.fillLastMissing(transfers.transfers, canDeduct)) {
      throw new SystemError(`Unable to determine valuation in ${JSON.stringify(transfers)}.`)
    }

    return values
  }

  /**
   * Try some heuristics if we can map transfers so that can solve multiple missing valuations.
   * @param transfers
   */
  async handleMultipleMissingValues(transfers: TransactionDescription): Promise<void> {
    // console.dir(transfers, { depth: null })
    // Transfers that have missing valuation.
    const missing: AssetTransfer[] = []
    // Those that has valuation sorted by reason-type-pair.
    const byType: Record<string, AssetTransfer[]> = {}
    for (const transfer of transfers.transfers) {
      if (transfer.amount === null) {
        missing.push(transfer)
      } else {
        const key = `${transfer.reason}.${transfer.type}`
        byType[key] = byType[key] || []
        byType[key].push(transfer)
      }
    }
    // console.dir(byType, { depth: null })

    const n = missing.length

    if (n < 2) {
      return
    }

    // Select type combinations we can solve.
    const keys = Object.keys(byType)

    if (setEqualArray(new Set(['income.statement', 'tax.statement']), keys)) {
      // Check if it looks that there are mismatching chains.
      for (const key of keys) {
        if (byType[key].length > n) {
          warning(`Trying to resolve more than one missing value, but probably leads to fail, since we got ${byType[key].length} entries for ${key} while expecting ${n}.`)
        }
      }

      // Collect slices by taking one of each. One from missing and one from all others.
      // Then resolve the missing one. Skip if some chain is shorter than others.
      for (let i = 0; i < n; i++) {
        const slice = [missing[i]]
        for (const key of keys) {
          if (byType[key][i]) {
            slice.push(byType[key][i])
          }
        }
        this.fillLastMissing(slice, true)
      }
      return
    }

    throw new NotImplemented(`Not able yet to calculate missing values for ${keys.join(' and ')}`)
  }

  /**
   * Analyze transfer and construct the corresponding transaction structure.
   * @param transfers
   * @returns
   */
  async analyze(transfers: TransactionDescription, segment: ImportSegment, config: ProcessConfig): Promise<TransactionDescription> {
    // Add new configurations in.
    merge.recursive(this.config, config)
    // Calculate some indicators and find settings.
    transfers = clone(transfers)

    // Collect accounts we are going to need.
    const accounts: Record<string, AccountNumber> = await this.collectAccounts(segment, transfers) as Record<string, AccountNumber>

    // Tune fees, if we have some and total needs adjustments.
    let feeIsMissingFromTotal: boolean = false
    const hasFees = transfers.transfers.filter(t => t.reason === 'fee').length > 0
    if (hasFees) {
      const nonFees = new Set(transfers.transfers.filter(t => t.reason !== 'fee' && !(t.reason === 'income' && t.asset.indexOf('PROFIT') >= 0) && !(t.reason === 'expense' && t.asset.indexOf('LOSS') >= 0)).map(t => t.reason))
      if (nonFees.size > 1) {
        throw new Error(`Too many non-fees (${[...nonFees].join(' and ')}) to determine actual transfer reasoning ${JSON.stringify(transfers.transfers)}.`)
      }
      const nonFee = [...nonFees][0]
      const feeTypes = new Set(transfers.transfers.filter(t => t.reason === 'fee').map(t => t.type))
      if (feeTypes.size > 1) {
        throw new Error(`Too many fee types (${[...feeTypes].join(' and ')}) to determine actual fee type ${JSON.stringify(transfers.transfers)}.`)
      }
      const feeType = [...feeTypes][0]
      let variable: string
      if (nonFee === 'trade') {
        switch (feeType) {
          case 'currency':
            variable = 'isTradeFeePartOfTotal'
            break
          case 'crypto':
            variable = 'isCryptoTradeFeePartOfTotal'
            break
          default:
            throw new NotImplemented(`Cannot handle fee type '${feeType}' yet.`)
        }
      } else if (nonFee === 'withdrawal') {
        variable = 'isWithdrawalFeePartOfTotal'
      } else if (nonFee === 'forex') {
        variable = 'isForexFeePartOfTotal'
      } else {
        throw new Error(`Handling non-fee '${nonFee}' not implemented.`)
      }
      feeIsMissingFromTotal = !await this.UI.getBoolean(config, variable, 'Is transaction fee of type {type} already included in the {reason} total?'.replace('{type}', `${feeType}`).replace('{reason}', await this.getTranslation(`reason-${nonFee}`)))

      // Adjust asset transfers by the fee paid as asset itself, when they are missing from transfer total.
      if (feeIsMissingFromTotal) {
        for (const fee of transfers.transfers.filter(t => t.reason === 'fee')) {
          const assetTransfers = transfers.transfers.filter(t => t.type === fee.type && t.asset === fee.asset && ['trade', 'forex', 'withdrawal'].includes(t.reason))
          if (assetTransfers.length < 1) {
            throw new SystemError(`Cannot find any assets to adjust for ${fee.asset} fee in ${JSON.stringify(transfers.transfers)}`)
          }
          if (assetTransfers[0].amount === undefined || fee.amount === undefined) {
            throw new SystemError(`Unable to adjust fee assets for ${fee.asset} fee in ${JSON.stringify(transfers.transfers)}`)
          }
          assetTransfers[0].amount -= fee.amount
        }
      }
    }

    // Fill in amounts for renamed assets.
    if (transfers.transfers.length > 0 && 'notes' in (transfers.transfers[0].data || {})) {
      const data = transfers.transfers[0].data as AdditionalTransferInfo
      const renamed = await this.getTranslation('note-renamed')
      if ((data?.notes || []).includes(renamed)) {

        const oldName = await this.getTranslation('note-old-name')
        const newName = await this.getTranslation('note-new-name')

        const oldTr = transfers.transfers.find(t => (t.data?.notes || []).includes(oldName))
        const newTr = transfers.transfers.find(t => (t.data?.notes || []).includes(newName))

        if (!oldTr) {
          throw new SystemError(`Cannot find old name '${oldName}' from transfer notes in renaming ${JSON.stringify(transfers.transfers)}.`)
        }
        if (!newTr) {
          throw new SystemError(`Cannot find new name '${newName}' from transfer notes in renaming ${JSON.stringify(transfers.transfers)}.`)
        }

        const { value, amount } = await this.getStock(segment.time, oldTr.type, oldTr.asset)

        oldTr.value = -value
        oldTr.amount = -amount
        newTr.value = +value
        newTr.amount = +amount
      }
    }

    // Resolve values in the system currency as cents for each line.
    const assetValues = await this.calculateAssetValues(transfers, segment)

    // Resolve what kind of transfers we have.
    const values = await this.collectOtherValues(transfers, assetValues)
    const kind: TransactionKind = values.kind as TransactionKind

    // Calculate stock change values.
    const feesToDeduct: Record<string, number> = {}
    const valueToDeduct: Record<string, number> = {}
    if (hasFees) {
      for (const transfer of transfers.transfers) {
        if (transfer.type === 'crypto' || transfer.type === 'stock' || transfer.type === 'short') {
          if (transfer.reason === 'fee') {
            feesToDeduct[transfer.asset] = (feesToDeduct[transfer.asset] || 0) + (transfer.amount || 0)
            valueToDeduct[transfer.asset] = (valueToDeduct[transfer.asset] || 0) + (transfer.value || 0)
          }
        }
      }
    }

    for (const transfer of transfers.transfers) {
      const change: Partial<Record<Asset, StockValueData>> = {}
      if (transfer.type === 'crypto' || transfer.type === 'stock' || transfer.type === 'short') {
        if (transfer.reason !== 'fee') {
          if (transfer.value === undefined) {
            throw Error(`Encountered invalid transfer value undefined for ${JSON.stringify(transfer)}.`)
          }
          if (transfer.amount === undefined) {
            throw Error(`Encountered invalid transfer amount undefined for ${JSON.stringify(transfer)}.`)
          }
          // Fees will reduce the same account than used in the transfers.
          // They have been added to the stock transfer already, so can be ignored here.
          change[transfer.asset as string] = {
            value: transfer.value || 0,
            amount: transfer.amount || 0
          }
          const data: AdditionalTransferInfo = { stock: { change } }
          if (feesToDeduct[transfer.asset]) {
            change[transfer.asset as string].amount -= feesToDeduct[transfer.asset]
            change[transfer.asset as string].value -= valueToDeduct[transfer.asset]
            data.feeAmount = feesToDeduct[transfer.asset]
            data.feeCurrency = transfer.asset as Currency | CryptoCurrency
            delete feesToDeduct[transfer.asset]
          }
          this.setData(transfer, data)
          const type = transfer.type === 'short' ? 'stock' : transfer.type
          await this.changeStock(segment.time, type, transfer.asset, transfer.amount, transfer.value)
        }
      }
    }

    if (Object.keys(feesToDeduct).length) {
      throw new Error(`There was no matching transfer to deduct ${Object.keys(feesToDeduct).join(' and ')} in ${JSON.stringify(transfers.transfers)}.`)
    }

    // Verify that we have values set and calculate total.
    // Collect missing values.
    let total = 0
    for (const transfer of transfers.transfers) {
      if (transfer.value === undefined) {
        throw new SystemError(`Failed to determine value of transfer ${JSON.stringify(transfer)}.`)
      }
      total += transfer.value
    }

    // Set up profit and losses.
    if (kind === 'trade' || kind === 'sell' || kind === 'short-buy') {
      if (total) {
        const soldAsset: AssetTransfer[] = (kind === 'short-buy'
          ? transfers.transfers.filter(t => t.reason === 'trade' && t.value && t.value > 0)
          : transfers.transfers.filter(t => t.reason === 'trade' && t.value && t.value < 0))
        if (soldAsset.length !== 1) {
          throw new BadState(`Did not found unique asset that was sold from ${JSON.stringify(transfers.transfers)}`)
        }
        let reason: AssetTransferReason
        let asset: VATTarget
        if (total > 0) {
          reason = 'income'
          if (kind === 'short-buy') {
            asset = 'TRADE_PROFIT_SHORT'
          } else {
            asset = `TRADE_PROFIT_${soldAsset[0].type.toUpperCase()}` as IncomeSource
          }
        } else {
          reason = 'expense'
          if (kind === 'short-buy') {
            asset = 'TRADE_LOSS_SHORT'
          } else {
            asset = `TRADE_LOSS_${soldAsset[0].type.toUpperCase()}` as ExpenseSink
          }
        }
        const gains: AssetTransfer = {
          reason,
          asset,
          amount: -total / 100,
          type: 'statement',
          value: -total
        }
        // Pass notes to profit/loss.
        if (soldAsset[0].data && soldAsset[0].data.notes) {
          gains.data = {
            notes: soldAsset[0].data.notes
          }
        }
        // Resolve account. If not known, ask.
        const account = await this.getAccount(gains.reason, gains.type, gains.asset, segment.id)
        const address: AccountAddress = `${gains.reason}.${gains.type}.${gains.asset}` as AccountAddress
        if (account) {
          accounts[address] = account
        } else {
          await this.UI.throwGetAccount(config, address)
        }
        transfers.transfers.push(gains)
        total = 0
      }
    }

    // At this point, total should be in order.
    if (Math.abs(total) > ZERO_CENTS) {
      throw new SystemError(`Total should be zero but got ${total} from ${JSON.stringify(transfers.transfers)}.`)
    }

    // Add more info where we can.
    this.fillCurrencies(transfers)

    /*
     * Put together transaction parts
     * ------------------------------
     */
    const tx = await this.createTransaction(transfers, kind, values, accounts, segment)
    transfers.transactions = [tx]

    // Helper to stop the process when need to check analysis final state during developing.
    // throw new Error('Stop')
    return transfers
  }

  /**
   * Construct a transaction based on the data collected.
   * @param transfers
   * @param kind
   * @param values
   * @param accounts
   * @param segment
   * @returns
   */
  async createTransaction(transfers: TransactionDescription, kind: TransactionKind, values: Record<string, string | number>, accounts: Record<string, AccountNumber>, segment: ImportSegment): Promise<Transaction> {

    const tx: Transaction = {
      date: segment.time,
      segmentId: segment.id,
      entries: []
    }

    // Clone execution result if already given.
    const executionResult = transfers.transactions?.length ? transfers.transactions[0].executionResult : undefined
    if (executionResult) {
      tx.executionResult = executionResult
    }

    let lastText
    for (let i = 0; i < transfers.transfers.length; i++) {
      // Figure out text.
      const transfer = transfers.transfers[i]
      const data = transfer.data || {}
      if (transfer.text) lastText = transfer.text
      let description = lastText
      if (!description) description = await this.constructText(kind, { ...values, ...data }, transfers)
      if (!description) {
        throw new SystemError(`Failed to construct description for ${JSON.stringify(transfer)}.`)
      }

      // Add notes.
      if (transfer.data && transfer.data.notes) {
        const notes: TransferNote[] = []
        for (const note of transfer.data.notes) {
          if (note && `${note}`.trim()) {
            const translatedNote = await this.getTranslation(`note-${note}`)
            if (translatedNote !== `note-${note}`) {
              notes.push(translatedNote)
            } else {
              notes.push(note)
            }
          }
        }
        if (notes.length) {
          description += ` (${notes.join(', ')})`
        }
      }

      // Set the account and amount.
      let txEntry: TransactionLine = {
        account: accounts[`${transfer.reason}.${transfer.type}.${transfer.asset}`],
        amount: transfer.value === undefined ? 0 : transfer.value,
        description
      }
      if (!txEntry.account) {
        throw new SystemError(`Cannot find account ${transfer.reason}.${transfer.type}.${transfer.asset} for entry ${JSON.stringify(txEntry)}`)
      }

      // Update balance and check for negative currency account if it needs to be configured.
      const total = this.applyBalance(txEntry)
      if (this.balances.mayTakeLoan(transfer.reason, transfer.type, transfer.asset) && realNegative(total)) {
        const addr: AccountAddress = `${transfer.reason}.${transfer.type}.${transfer.asset}` as AccountAddress
        const debtAddr: AccountAddress = this.balances.debtAddress(addr)
        const debtAccount = this.getConfig(`account.${debtAddr}`, null)
        if (debtAccount === null) {
          await this.UI.throwDebtAccount(this.config, txEntry.account, addr)
        }
      }

      // Add data and rates.
      if (transfer.data) {
        txEntry.data = clone(transfer.data)
      }

      // Check if there are deposits or withdrawals and make sure they are added.
      const { reason, type } = transfer
      if (type === 'external') {
        if (reason === 'deposit') {
          const recordDeposits = await this.UI.getBoolean(this.config, 'recordDeposits', 'Deposits tend to appear in two import sources. Do you want to record deposits in this import?')
          if (!recordDeposits) {
            tx.executionResult = 'ignored'
          }
        } else if (reason === 'withdrawal') {
          const recordWithdrawals = await this.UI.getBoolean(this.config, 'recordWithdrawals', 'Withdrawals tend to appear in two import sources. Do you want to record withdrawals in this import?')
          if (!recordWithdrawals) {
            tx.executionResult = 'ignored'
          }
        }
      }

      // Post-process and add it to the list.
      txEntry = await this.postProcessTags(txEntry, transfer, segment)
      tx.entries.push(txEntry)
    }

    return tx
  }

  /**
   * Handle tags for one transaction line.
   * @param tx
   * @param segment
   * @param config
   */
  async postProcessTags(tx: TransactionLine, transfer: AssetTransfer, segment: ImportSegment): Promise<TransactionLine> {
    // Find out tags.
    let tags
    // Check from transfer.
    if (!('tags' in transfer)) {
      // Find from config and ask if not yet given.
      tags = await this.getTags(transfer.reason, transfer.type, transfer.asset)
    } else {
      tags = transfer.tags
    }
    if (tags) {
      // Handle also string notation '[A][B]'
      if (typeof tags === 'string' && /^(\[[a-zA-Z0-9]+\])+$/.test(tags)) {
        tags = tags.substr(1, tags.length - 2).split('][')
      }
      if (!(tags instanceof Array)) {
        throw new BadState(`Invalid tags ${JSON.stringify(tags)}`)
      }
      tx.description = `[${tags.filter(t => !!t).join('][')}] ${tx.description}`
    }
    return tx
  }

  /**
   * Get the specific account from the settings. Checks also more generic '<reason>.<type>.*' version if the exact not found.
   * @param reason
   * @param type
   * @param asset
   * @returns
   */
  async getAccount(reason: AssetTransferReason, type: AssetType, asset: Asset, segmentId?: SegmentId): Promise<undefined | AccountNumber> {
    const account = this.getConfig(`account.${reason}.${type}.${asset}`, null)
    if (typeof (account) === 'string') {
      return account as AccountNumber
    }
    const generic = this.getConfig(`account.${reason}.${type}.*`, null)
    if (typeof (generic) === 'string') {
      return generic as AccountNumber
    }
    if (/^[0-9]+$/.test(asset)) {
      return asset as AccountNumber
    }

    if (!segmentId) {
      return undefined
    }
    // If we know segment ID, we could try to check if there is question about the account answered.
    const answers: Record<SegmentId, Record<AccountAddress, AccountNumber>> = this.getConfig('answers', {}) as Record<SegmentId, Record<AccountAddress, AccountNumber>>

    if (answers[segmentId] && answers[segmentId][`account.${reason}.${type}.${asset}`]) {
      return answers[segmentId][`account.${reason}.${type}.${asset}`]
    }
  }

  /**
   * Get tags for the transfer if defined in configuration.
   * @param reason
   * @param type
   * @param asset
   * @returns
   */
  async getTags(reason: AssetTransferReason, type: AssetType, asset: Asset): Promise<Tag[] | undefined> {
    for (const variable of [`tags.${reason}.${type}.${asset}`, `tags.${reason}.${type}.*`, `tags.${reason}.*.*`, 'tags.*.*.*']) {
      const tags = this.getConfig(variable, null)
      if (tags !== null) {
        if (tags instanceof Array) {
          return tags
        }
        throw new BadState(`Bad tags configured ${JSON.stringify(tags)} for tags.${reason}.${type}.${asset}`)
      }
    }
  }

  /**
   * Similar to getTags() but use account address.
   * @param addr
   */
  async getTagsForAddr(addr: AccountAddress) {
    const [reason, type, asset] = addr.split('.')
    return this.getTags(reason as AssetTransferReason, type as AssetType, asset as Asset)
  }

  /**
   * Get the UI query for account from the settings if defined.
   * @param reason
   * @param type
   * @param asset
   * @returns
   */
  async getAccountQuery(reason: AssetTransferReason, type: AssetType, asset: Asset): Promise<undefined | UIQuery> {
    const account = this.getConfig(`account.${reason}.${type}.${asset}`, null)
    if (typeof (account) === 'object' && account !== null) {
      return account as UIQuery
    }
  }

  /**
   * Builder for text descriptions.
   * @param template
   * @param values
   */
  async constructText(kind: TransactionKind, values: Record<string, unknown>, original: TransactionDescription): Promise<string> {

    const template = `import-text-${kind}`

    // Fetch the text modifiers.
    const prefix: string = this.getConfig('transaction.prefix', '') as string

    // Collect translations to one string.
    let text: string = await this.getTranslation(template)
    if (text === template) {
      throw new BadState(`Not able to find translation for '${template}'.`)
    }
    text = `${prefix}${text}`

    // Substitute values into the string.
    while (true) {
      const match = /(\{([a-zA-Z0-9]+)\})/.exec(text)
      if (!match) break
      if (values[match[2]] === undefined) {
        throw new BadState(`Not able to find value '${match[2]}' needed by '${text}' from ${JSON.stringify(original)}`)
      }
      const value = `${values[match[2]]}`
      text = text.replace(match[1], value)
    }
    return text
  }

  /**
   * Find the rate in the default currency for the asset.
   * @param time
   * @param type
   * @param asset
   */
  async getRateAt(time: Date, type: AssetType, asset: Asset): Promise<number> {

    const exchange = this.handler.name as AssetExchange
    const currency = this.getConfig('currency') as Currency
    if ((type === 'currency' && asset === currency) || type === 'account') {
      return 1.0
    }
    if (!exchange && type === 'crypto') {
      throw new Error(`Exchange is compulsory setting in cryptocurrency import. Cannot determine rate for ${asset} at ${time}.`)
    }
    if (!isTransactionImportConnector(this.handler.system.connector)) {
      throw new SystemError('Connector used is not a transaction import connector.')
    }
    return this.handler.getRate(time, type, asset, currency, exchange)
  }

  /**
   * Find the amount of asset owned at the spesific time.
   * @param time
   * @param type
   * @param asset
   * @returns
   */
  async getStock(time: Date, type: AssetType, asset: Asset): Promise<StockValueData> {
    if (!isTransactionImportConnector(this.handler.system.connector)) {
      throw new SystemError('Connector used is not a transaction import connector.')
    }
    const account: AccountNumber = await this.getAccount('trade', type, asset) as AccountNumber
    if (!account) {
      throw new Error(`Unable to find account for ${type} ${asset}.`)
    }
    // If no records yet, fetch it using the connector.
    if (!this.stocks[account]) {
      this.stocks[account] = new StockBookkeeping(`Account ${account}`)
    }
    if (!this.stocks[account].has(type, asset)) {
      const { value, amount } = await this.handler.system.connector.getStock(time, account, asset as TradeableAsset)
      this.stocks[account].set(time, type, asset, amount, value)
      return { value, amount }
    }
    const ret = this.stocks[account].get(time, type, asset)
    return ret
  }

  /**
   * Update internal stock bookkeeping.
   * @param time
   * @param type
   * @param asset
   * @param amount
   * @param value
   */
  async changeStock(time: Date, type: AssetType, asset: Asset, amount: number, value: number): Promise<void> {
    // Force reading the stock initial status.
    await this.getStock(time, type, asset)

    const account = await this.getAccount('trade', type, asset)
    if (!account) {
      throw new Error(`Unable to find account for ${type} ${asset}.`)
    }
    if (!this.stocks[account]) {
      this.stocks[account] = new StockBookkeeping(`Account ${account}`)
    }
    await this.stocks[account].change(time, type, asset, amount, value)
  }

  /**
   * Get the average price of the asset at the specific time.
   * @param time
   * @param type
   * @param asset
   * @returns
   */
  async getAverage(time: Date, type: AssetType, asset: Asset): Promise<number> {
    const { amount, value } = await this.getStock(time, type, asset)
    return value / amount
  }

  /**
   * Detect currencies and their rates and fill in data where we can.
   * @param transfers
   */
  fillCurrencies(transfers: TransactionDescription): void {
    const rates: Partial<Record<Currency, number>> = {}
    const explicitCurrencies: Set<Currency> = new Set()

    // Helper to warn different rates.
    const setRate = (currency: Currency, rate: number): void => {
      if (rates[currency] !== undefined && Math.abs(rate - (rates[currency] || 0)) > 0.1) {
        warning(`Found two different rates ${rates[currency]} and ${rate} for ${currency} on ${JSON.stringify(transfers.transfers)}.`)
      }
      rates[currency] = rate
    }

    // Scan for rates.
    transfers.transfers.forEach(transfer => {
      if (transfer.data && transfer.data.currency && transfer.data.currencyValue && transfer.value !== undefined) {
        setRate(transfer.data.currency, transfer.value / transfer.data.currencyValue)
        explicitCurrencies.add(transfer.data.currency)
      }
      if (transfer.data && transfer.data.rates !== undefined) {
        Object.keys(transfer.data.rates).forEach(currency => {
          if (transfer.data !== undefined && transfer.data.rates !== undefined && transfer.data.rates[currency] !== undefined) {
            setRate(currency as Currency, parseFloat(transfer.data.rates[currency]))
          }
        })
      }
    })
    if (Object.keys(rates).length === 0) {
      return
    }

    // Fill in rates.
    transfers.transfers.forEach(transfer => {
      transfer.data = transfer.data || {}
      transfer.data.rates = transfer.data.rates || {}
      Object.assign(transfer.data.rates, rates)
    })

    // If unique, calculate value for every entry.
    if (explicitCurrencies.size !== 1) {
      return
    }
    const currency: Currency = [...explicitCurrencies][0]
    transfers.transfers.forEach(transfer => {
      if (transfer.data && transfer.data.currency === undefined && transfer.data.currencyValue === undefined && transfer.value !== undefined) {
        if (rates[currency] !== undefined) {
          transfer.data = transfer.data || {}
          transfer.data.currency = currency
          transfer.data.currencyValue = Math.round(transfer.value / (rates[currency] || 0))
        }
      }
    })

  }
}
