import { Knowledge } from "../bookkeeper"
import { warning } from "../logging"
import { AccountAddress, AccountType, Asset, AssetCode, Currency, ExpenseSink, IncomeSource, PluginCode, TaxType } from "../types"

/**
 * A condition description to match accunts.
 */
export type AccountLookupCondition = {
  code: Asset | TaxType | AssetCode | Asset[] | TaxType[] | AssetCode[]
  currency?: Currency
  type?: AccountType | AccountType[]
  plugin?: PluginCode
  '!plugin'?: PluginCode
  addChildren?: boolean
}

/**
 * Additional information for looking up an account.
 */
export interface AccountLookupOption {
  defaultCurrency: Currency,
  plugin: PluginCode,
  strict?: boolean
}

/**
 * Convert address lookup to condition.
 * @param addr
 * @param options
 * @returns
 */
export function conditions(addr: AccountAddress, options: AccountLookupOption): AccountLookupCondition | null {
  const [reason, type, asset] = addr.split('.')

  if (reason === 'debt') {
    if (type === 'currency') {
      return { code: 'CREDITORS', addChildren: true, currency: asset as Currency, plugin: options.plugin }
    }
  }

  if (reason === 'deposit') {
    if (type === 'currency') {
      return { code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin, type: AccountType.ASSET }
    }
    if (type === 'external') {
      return { code: 'CASH', addChildren: true, currency: asset as Currency, '!plugin': options.plugin, type: AccountType.ASSET }
    }
  }

  if (reason === 'distribution') {
    return null
  }

  if (reason === 'dividend') {
    if (type === 'currency') {
      return { code: 'DIVIDEND', addChildren: true, currency: asset as Currency, plugin: options.plugin }
    }
  }

  if (reason === 'expense') {
    if (type === 'currency') {
      return options.plugin ? { code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin, type: AccountType.ASSET } : null
    }
    if (type === 'statement') {
      return { type: AccountType.EXPENSE, code: asset as ExpenseSink }
    }
  }

  if (reason === 'fee') {
    if (type === 'currency') {
      return options.plugin ? { code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin, type: AccountType.ASSET } : null
    }
  }

  if (reason === 'forex') {
    if (type === 'currency') {
      return { code: 'CASH', currency: asset as Currency, plugin: options.plugin }
    }
  }

  if (reason === 'income') {
    if (type === 'currency') {
      return options.plugin ? { code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin, type: AccountType.ASSET } : null
    }
    if (type === 'statement') {
      return { type: AccountType.REVENUE, code: asset as IncomeSource }
    }
  }

  if (reason === 'investment') {
    if (type === 'currency') {
      return null
    }
    if (type === 'statement') {
      return { type: AccountType.EQUITY, code: asset as Currency, plugin: options.plugin }
    }
  }

  if (reason === 'tax') {
    if (type === 'currency') {
      return null
    }
    if (type === 'statement') {
      return { type: [AccountType.LIABILITY, AccountType.ASSET], code: asset as TaxType }
    }
  }

  if (reason === 'trade') {
    if (type === 'currency') {
      return { type: AccountType.ASSET, code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin }
    }
    if (type === 'stock') {
      return { type: AccountType.ASSET, code: 'CURRENT_PUBLIC_STOCK_SHARES', plugin: options.plugin }
    }
    if (type === 'crypto') {
      return { type: AccountType.ASSET, code: 'CURRENT_CRYPTOCURRENCIES', plugin: options.plugin }
    }
  }

  if (reason === 'transfer') {
    if (type === 'currency') {
      return { type: AccountType.ASSET, code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin }
    }
    if (type === 'external') {
      if (asset === 'NEEDS_MANUAL_INSPECTION') {
        return { code: asset }
      }
      return null
    }
  }

  if (reason === 'withdrawal') {
    if (type === 'currency') {
      return { code: 'CASH', addChildren: true, currency: asset as Currency, plugin: options.plugin, type: AccountType.ASSET }
    }
    if (type === 'external') {
      return { code: 'CASH', addChildren: true, currency: asset as Currency, '!plugin': options.plugin, type: AccountType.ASSET }
    }
  }

  const message = `No SQL conversion known for account address '${addr}'.`
  if (options.strict) {
    throw new Error(message)
  }
  warning(message)
  return null
}

/**
 * Create SQL expression matching the accounts according to lookup parameters.
 *
 * @param addr
 * @param options
 * @returns
 */
export function address2sql(addr: AccountAddress, options: AccountLookupOption, knowledge: Knowledge | null = null): string | null {
  if (knowledge === null) {
    knowledge = new Knowledge()
  }

  const cond = conditions(addr, options)
  if (cond === null) {
    return null
  }

  const addSql: string[] = []

  // If looking for default currency, it can be also unset.
  if (cond.currency === options.defaultCurrency) {
    addSql.push(`(data->>'currency' = '${cond.currency}' OR data->>'currency' IS NULL)`)
    delete cond.currency
  }

  // Add condition for type(s).
  if (cond.type) {
    if (typeof cond.type === 'string') {
      addSql.push(`(type = '${cond.type}')`)
    } else {
      addSql.push('(' + cond.type.map(t => `type = '${t}'`).join(' OR ') + ')')
    }
    delete cond.type
  }

  // Allow any children.
  if (cond.addChildren) {
    cond.code = [cond.code as Asset, ...knowledge.children(cond.code as Asset) as Asset[]]
    delete cond.addChildren
  }

  // Helper to handle other conditions.
  const key2sql = (key: string): string => {
    if (key[0] === '!') {
      return `(data->>'${key.substring(1)}' != '${cond[key]}')`
    }
    let values = cond[key]
    if (values instanceof Array) {
      if (values.length > 1) {
        return `(data->>'${key}' IN (${values.map(k => "'" + k + "'").join(', ')}))`
      }
      values = values[0]
    }
    return `(data->>'${key}' = '${values}')`
  }

  const sql = Object.keys(cond).map(key => key2sql(key))

  return [...sql, ...addSql].join(' AND ')
}
