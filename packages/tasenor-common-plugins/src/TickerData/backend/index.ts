import { DataPlugin } from '@tasenor/common-node'
import { ALL, PluginCode, Version } from '@tasenor/common'

interface ExchangeInfo {
  code: string
  name: string
  aliases: string[]
  file: string
  type: 'stock' | 'crypto'
}

interface TickerInfo {
  exchange: Omit<Omit<ExchangeInfo, 'file'>, 'type'>
  ticker: string
  name: string
  aliases: string[]
}

/**
 * Data sets for stock tickers and crypto currencies.
 *
 * Backend Queries:
 *
 * * (*exchange*, ALL) - List of all known exhanges.
 * * (*exchange*, *code*) - Exchange data if code, name or alias match, null otherwise.
 * * (*ticker*, *code*) - Lookup from all exchanges the specific ticker.
 * * (*ticker*, *exchange*:*code*) - Lookup from the given exchange the specific ticker.
 *
 * Data sources and/or ideas:
 *
 * * hel - Manually constructed from public Nasdaq Helsinki data.
 * * crypto - https://github.com/crypti/cryptocurrencies/blob/master/cryptocurrencies.json
 *
 *   ...others done manually so far (need some source and conversion tool)...
 *
 * Note: there is useful tool to generate from CSV in `tasenor-bookkeeper/apps/cli/bin/convert-csv-to-map.mjs`.
 */
class TickerData extends DataPlugin {

  // TODO: Currency name data.

  constructor() {
    super({ common: [], backend: ['exchange', 'ticker'] })

    this.code = 'TickerData'as PluginCode
    this.title = 'Asset ticker names'
    this.version = '1.0.0' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 7H5v10h11l3.55-5z" opacity=".3"/><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/></svg>'
    this.releaseDate = '2024-01-15'
    this.use = 'backend'
    this.type = 'data'
    this.description = 'List of stock tickers and exchanges and their names. Lookup services for those.'

    this.languages = {
    }
  }

  async queryBackend<T>(dataSet: string, query: typeof ALL | string): Promise<undefined | T> {
    if (dataSet === 'exchange') {
      return this.queryExchange(query) as T
    }
    if (dataSet === 'ticker' && query !== ALL) {
      return this.queryTicker(query) as T
    }
    return undefined
  }

  async queryExchange(query: typeof ALL | string): Promise<undefined | ExchangeInfo | ExchangeInfo[]> {
    if (query === ALL) {
      // This also priority order if there is no better knowledge for ticker exchange, when queried.
      return [
        {
          code: 'ETF',
          name: 'List of ETFs',
          aliases: [],
          file: 'etf.json',
          type: 'stock'
        },
        {
          code: 'NYSE',
          name: 'New York Stock Exchange',
          aliases: [],
          file: 'nyse.json',
          type: 'stock'
        },
        {
          code: 'NASDAQ',
          name: 'The Nasdaq Stock Market',
          aliases: ['Nasdaq', 'National Association of Securities Dealers Automated Quotations'],
          file: 'nasdaq.json',
          type: 'stock'
        },
        {
          code: 'XETRA',
          name: 'Deutsche Börse',
          aliases: [],
          file: 'xetra.json',
          type: 'stock'
        },
        {
          code: 'HEL',
          name: 'Nasdaq Helsinki',
          aliases: ['HE'],
          file: 'hel.json',
          type: 'stock'
        },
        {
          code: 'TAL',
          name: 'Nasdaq Tallinn',
          aliases: ['TL'],
          file: 'tal.json',
          type: 'stock'
        },
        {
          code: 'OTC',
          name: 'Over the Counter',
          aliases: ['PINK', 'Pink Sheets'],
          file: 'otc.json',
          type: 'stock'
        },
        {
          code: 'TSX',
          name: 'Toronto Stock Exchange',
          aliases: ['TO'],
          file: 'tsx.json',
          type: 'stock'
        },
        {
          code: 'CRYPTO',
          name: 'Crypto Currency',
          aliases: [],
          file: 'cryptocurrencies.json',
          type: 'crypto'
        },
      ]
    }
    const all = await this.queryExchange(ALL) as ExchangeInfo[]
    for (const ex of all) {
      if (ex.code === query || ex.name === query || ex.aliases.includes(query)) {
        return ex
      }
    }
    return undefined
  }

  /**
   * If the result is ambiquous, all results are returned.
   */
  async queryTicker(query: string): Promise<undefined | TickerInfo[]> {
    // TODO: We could add type prefix like 'stock:HEL:UPM', 'crypto:BTC' and default it to the 'stock'.
    //       That way we don't get random crypto for unknown stock.
    //       It could be forced even, since we rarely don't know the context.
    // Single exchange.
    if (query.indexOf(':') > 0) {
      const [exchange, ticker] = query.split(':')
      const ex = await this.queryExchange(exchange) as ExchangeInfo | undefined
      if (ex === undefined) {
        return undefined
      }
      // TODO: Alias support. Perhaps post-load hook and if instead of the company name we have
      // ["Name of the company", "ALIAS1", "ALIAS2"] the aliases are taken from there.
      const tickers: Record<string, string> = this.loadCached(ex.file)
      if (tickers[ticker] === undefined) {
        return undefined
      }
      return [{
        exchange: { code: ex.code, name: ex.name, aliases: ex.aliases },
        ticker,
        name: tickers[ticker],
        aliases: []
      }]
    }

    // Scan all exchanges.
    let result: TickerInfo[] = []
    for (const ex of await this.queryExchange(ALL) as ExchangeInfo[]) {
      const match = await this.queryTicker(`${ex.code}:${query}`)
      if (match !== undefined) {
        result = result.concat(match)
      }
    }
    return result.length ? result : undefined
  }
}

export default TickerData
