import { waitPromise } from '@tasenor/common'
import axios from 'axios'

const API_URL = process.env.API_URL
const API_SITE_TOKEN = process.env.API_SITE_TOKEN

/**
 * Call tasenor service.
 * @param service
 * @param data
 */
export async function callTestService(service, data: Record<string, string>) {

  if (!API_URL) {
    throw new Error('Cannot use testing services without setting environment API_URL.')
  }
  if (!API_SITE_TOKEN) {
    throw new Error('Cannot use testing services without setting environment API_SITE_TOKEN.')
  }
  const auth = await axios.get(`${API_URL}/auth/refresh`, {
    headers: {
      Authorization: `Bearer ${API_SITE_TOKEN}`
    }
  })
  if (!auth || !auth.data || !auth.data.token) {
    console.log(`\u001b[31mAxios call to ${API_URL} failed to authenticate.\u001b[32m`)
  }
  const { token } = auth.data

  const args: string[] = []
  Object.keys(data).forEach(key => {
    args.push(`${key}=${encodeURIComponent(data[key])}`)
  })

  await waitPromise(1500)

  return await axios.get(`${API_URL}/services/${service}?${args.join('&')}&token=${token}`).catch(err => {
    console.log(`\u001b[31mAxios call to ${API_URL} failed: ${JSON.stringify(err.response && err.response.data)}.\u001b[32m`)
    return null
  }).then(resp => {
    return resp && resp.data
  })
}

/**
 * Get the currency value in other currency.
 * @param from
 * @param to
 * @param date
 * @returns
 */
export async function getTestCurrencyRate(from, to, date) {
  const resp = await callTestService('historical-currency-rate', { from, to, date })
  return resp ? resp.rate : null
}

/**
 * Get the crypto value in other currency.
 * @param from
 * @param to
 * @param date
 * @returns
 */
export async function getTestCryptoRate(from, to, date) {
  const resp = await callTestService('historical-crypto-rate', { from, to, date })
  return resp ? resp.rate : null
}
