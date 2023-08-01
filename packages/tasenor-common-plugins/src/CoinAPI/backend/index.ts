import { ServicePlugin } from '@tasenor/common-node'
import { PluginCode, Version, TasenorElement } from '@tasenor/common'

/**
 * Service: historical-crypto-rate
 *
 * Query:
 * - *from* A crypto asset code to convert from.
 * - *to* A currency code to convert to.
 * - *date* A timestamp when rating is wanted.
 *
 * Response:
 * {
 *   status: 200,
 *   rate: 0.88123123
 * }
 */
class CoinAPI extends ServicePlugin {

  constructor() {
    super('historical-crypto-rate')

    this.code = 'CoinAPI' as PluginCode
    this.title = 'Coin API Service'
    this.version = '1.0.5' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><path d="M12.89,11.1c-1.78-0.59-2.64-0.96-2.64-1.9c0-1.02,1.11-1.39,1.81-1.39c1.31,0,1.79,0.99,1.9,1.34l1.58-0.67 C15.39,8.03,14.72,6.56,13,6.24V5h-2v1.26C8.52,6.82,8.51,9.12,8.51,9.22c0,2.27,2.25,2.91,3.35,3.31 c1.58,0.56,2.28,1.07,2.28,2.03c0,1.13-1.05,1.61-1.98,1.61c-1.82,0-2.34-1.87-2.4-2.09L8.1,14.75c0.63,2.19,2.28,2.78,2.9,2.96V19 h2v-1.24c0.4-0.09,2.9-0.59,2.9-3.22C15.9,13.15,15.29,11.93,12.89,11.1z M3,21H1v-6h6v2l-2.48,0c1.61,2.41,4.36,4,7.48,4 c4.97,0,9-4.03,9-9h2c0,6.08-4.92,11-11,11c-3.72,0-7.01-1.85-9-4.67L3,21z M1,12C1,5.92,5.92,1,12,1c3.72,0,7.01,1.85,9,4.67L21,3 h2v6h-6V7l2.48,0C17.87,4.59,15.12,3,12,3c-4.97,0-9,4.03-9,9H1z"/></g></svg>'
    this.releaseDate = '2022-05-13'
    this.use = 'backend'
    this.type = 'service'
    this.description = 'This service provides historical rates from https://coinapi.io/. Currently it has a service `historical-crypto-rate`, which can be used to fetch historical crypto currency rates.'

    this.languages = {
      en: {
        'label-apiKey': 'Your API key to use',
      },
      fi: {
        'label-apiKey': 'API key eli avain',
      }
    }
  }

  async query(db, settings, service, query) {
    const apiKey = settings.apiKey
    if (!apiKey) {
      return {
        status: 400,
        message: 'Setting apiKey is not set.'
      }
    }
    if (!query.date) {
      return {
        status: 400,
        message: 'Query parameter `date` is not set.'
      }
    }
    if (!query.from) {
      return {
        status: 400,
        message: 'Query parameter `from` is not set.'
      }
    }
    if (!query.to) {
      return {
        status: 400,
        message: 'Query parameter `to` is not set.'
      }
    }
    const date = new Date(query.date)
    const res = await this.cachedRequest(
      db,
      service,
      'GET', `https://rest.coinapi.io/v1/exchangerate/${query.from}/${query.to}`,
      {
        time: date.toISOString()
      }, {
        'X-CoinAPI-Key': apiKey,
      })
    return res.status === 200 ? { status: 200, rate: res.data.rate } : res
  }

  getSettings(): TasenorElement {
    return {
      type: 'flat',
      elements: [
        {
          type: 'text',
          name: 'apiKey',
          actions: {}
        },
        {
          type: 'button',
          label: 'Save',
          actions: {
            onClick: { type: 'saveSettings', backend: true, plugin: 'CoinAPI' as PluginCode }
          }
        }
      ]
    }
  }
}

export default CoinAPI
