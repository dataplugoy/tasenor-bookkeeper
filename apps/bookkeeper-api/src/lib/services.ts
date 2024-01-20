import { AssetExchange, CryptoCurrency, Currency, GET, PluginService, ShortDate, Url, Value } from '@tasenor/common'

/**
 * Call some of the service plugins internally.
 */
export async function callService(service: PluginService, query: Record<string, Value>): Promise<unknown> {
  const url: Url = `http://localhost:${process.env.PORT}/services/${service}` as Url
  const result = await GET(url, query)
  if (!result.success) {
    throw new Error(`Calling service ${service} with query ${JSON.stringify(query)} failed: ${JSON.stringify(result)}.`)
  }
  return result.data
}

/**
 * Get historical currency rate.
 * @param time
 * @param crypto
 * @param currency
 * @returns
 */
export async function getCurrencyRate(time: Date | ShortDate, query: Currency, currency: Currency): Promise<number> {
  if (typeof time === 'string') {
    time = new Date(time)
  }
  const data: { rate: number } = await callService('historical-currency-rate', {
    from: query,
    to: currency,
    date: time.toISOString()
  }) as { rate: number }

  return data.rate
}

/**
 * Get historical crypto currency rate.
 * @param time
 * @param crypto
 * @param currency
 * @returns
 */
export async function getCryptoRate(time: Date | ShortDate, crypto: CryptoCurrency, currency: Currency, exchange: AssetExchange | null = null): Promise<number> {
  if (typeof time === 'string') {
    time = new Date(time)
  }
  const data: { rate: number } = await callService('historical-crypto-rate', {
    from: crypto,
    to: currency,
    date: time.toISOString(),
    exchange
  }) as { rate: number }

  return data.rate
}
