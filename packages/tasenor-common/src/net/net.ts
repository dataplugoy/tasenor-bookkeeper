import FormData from 'form-data'
import jwtDecode from 'jwt-decode'
import axios from 'axios'
import { debug, error, note, warning } from '../logging'
import { isLocalUrl, LocalUrl, Token, TokenPair, Url, UUID, Value } from '../types'

/**
 * HTTP methods in use on the system.
 */
export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'HEAD'

/**
 * Status codes used in the system.
 */
export type SupportedSuccessStatus = 200 | 204
export type SupportedFailStatus = 400 | 401 | 403 | 404 | 500
export type SupportedStatus = SupportedSuccessStatus | SupportedFailStatus

/**
 * A response content format for successfull REST call.
 */
export interface HttpSuccessResponse<T=Value> {
  status: SupportedSuccessStatus,
  success: true,
  data?: T
}
export function isHttpSuccessResponse(obj: unknown): obj is HttpSuccessResponse {
  if (typeof (obj) === 'object' && obj !== null && 'success' in obj) {
    return (obj as { success: boolean }).success
  }
  return false
}

/**
 * A response content format for unsuccessfull REST call.
 */
export interface HttpFailureResponse {
  status: SupportedFailStatus,
  success: false,
  message: string
}
export function isHttpFailureResponse(obj: unknown): obj is HttpFailureResponse {
  return !isHttpSuccessResponse(obj)
}

/**
 * A HTTP response content format for REST call.
 */
export type HttpResponse<T=Value> = HttpSuccessResponse<T> | HttpFailureResponse

/**
 * Internal configuration interface for keeping token and refresh information per sites.
 */
export interface NetConfig {
  baseUrl?: Url,
  sites?: {
    [siteUrl: string]: {
      uuid?: UUID,
      refreshUrl?: LocalUrl,
      token?: Token
      refreshToken?: Token
    }
  }
}
// Global configuration.
const config: NetConfig = {
  sites: {}
}

/**
 * Update network configuration for the sites and variables given as an object.
 * @param conf
 */
function configure(conf: NetConfig): void {
  if (conf.baseUrl) {
    debug('NET', `Setting baseUrl to ${conf.baseUrl}`)
    config.baseUrl = conf.baseUrl
  }
  if (conf.sites) {
    for (const site of Object.keys(conf.sites)) {
      if (!config.sites) {
        config.sites = {}
      }
      if (!config.sites[site]) {
        config.sites[site] = {}
      }
      debug('NET', `Configuring site ${site} to`, conf.sites[site])
      Object.assign(config.sites[site], conf.sites[site])
    }
  }
}

/**
 * Additional headers used in the system.
 */
export interface HttpExtraHeaders {
  Accept?: string,
  'Content-Type'?: string,
  Authorization?: string,
  'X-UUID'?: UUID
}

/**
 * A type of a function that performs a REST call.
 */
export type HttpRequestFunction = (url: LocalUrl | Url, data?: Value | FormData, extraHeaders?: HttpExtraHeaders) => Promise<HttpResponse>

/**
 * Get the configuration variable for the site URL.
 * @param url
 * @param name
 * @returns
 */
const getConf = (url: Url, name: string): Value | (() => void) => {
  const origin = new URL(url).origin
  if (config.sites && config.sites[origin] && name in config.sites[origin]) {
    return config.sites[origin][name]
  }
  return null
}

/**
 * Set the configuration variable for the site URL.
 * @param url
 * @param name
 * @param value
 */
const setConf = (url: Url, name: string, value: Value | (() => void)): void => {
  const origin = new URL(url).origin
  if (!config.sites) {
    config.sites = {}
  }
  if (!config.sites[origin]) {
    config.sites[origin] = {}
  }
  config.sites[origin][name] = value
}

// Helper to create full url from local url if needed.
const constructUrl = (url: string): Url => {
  if (isLocalUrl(url)) {
    if (!config.baseUrl) {
      throw new Error(`Cannot use local URL '${url}' when there is no base URL configured.`)
    }
    return config.baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '') as Url
  }
  return url as Url
}

// Helper to refresh token.
async function refreshToken(url: Url): Promise<boolean | Error> {
  setConf(url, 'token', null)
  if (getConf(url, 'refreshToken') && getConf(url, 'refreshUrl')) {
    const refreshUrl = `${new URL(url).origin}${getConf(url, 'refreshUrl')}` as Url
    debug('NET', `Refreshing token from ${refreshUrl}.`)
    const headers = {
      Authorization: `Bearer ${getConf(url, 'refreshToken')}`
    }
    if (getConf(url, 'uuid')) {
      headers['X-UUID'] = getConf(url, 'uuid')
    }
    const refreshed = await axios({
      method: 'GET',
      url: refreshUrl,
      headers
    }).catch(err => {
      const logout = getConf(url, 'logout') as () => void
      if (logout) {
        logout()
        return false
      }
      error(`Fetching token for ${url} failed: ${err}`)
      return err
    })
    if (refreshed.status === 200 && refreshed.data && refreshed.data.token) {
      setConf(url, 'token', refreshed.data.token)
      if (refreshed.data.refresh) {
        setConf(url, 'refreshToken', refreshed.data.refresh)
      }
      debug('NET', `Received new token from ${url}.`)
      return true
    }
    const logout = getConf(url, 'logout') as () => void
    if (logout) {
      logout()
      return false
    }
    error('Invalid response:', refreshed)
    return new Error('Unable to understand token response.')
  }
  return new Error(`Site ${url} not configured for token refreshing.`)
}

/**
 * Construct a function for handling one particular method of HTTP requests.
 * @param method HTTP method.
 * @returns
 */
function createRequestHandler(method: HttpMethod): HttpRequestFunction {
  return async (url0: LocalUrl | Url, data?: Value | FormData, extraHeaders?: HttpExtraHeaders) => {

    // Calculate URL and origin.
    const url: Url = constructUrl(url0)
    const origin = new URL(url).origin
    if (!config.sites || !config.sites[origin]) {
      warning(`We don't have any net configuration for site ${origin}.`)
    }

    // Helper to perform actual request.
    async function doRequest({ method, url, data }): Promise<HttpResponse> {
      debug('NET', `Handling request: ${method} ${url} with data`, data)
      const headers: { Authorization?: string } = {}
      Object.assign(headers, extraHeaders)
      if (config.sites && config.sites[origin] && !headers.Authorization) {
        const token = getConf(url, 'token') as string
        if (token) {
          debug('NET', `Setting token to ${token}`)
          headers.Authorization = `Bearer ${token}`
        }
        const uuid = getConf(url, 'uuid') as string
        if (uuid) {
          debug('NET', `Setting UUID to ${uuid}`)
          headers['X-UUID'] = uuid
        }
      }
      // Construct a call object.
      const axiosCall: Record<string, string | Record<string, string> > = { method, url, data, headers }
      if (method === 'GET') {
        if (data) {
          axiosCall.params = data
        }
      }
      if (data === null || data === undefined) {
        delete axiosCall.data
      }

      // Instanceof operator does not work reliably with FormData, so let us use some heuristics to recognize form data.
      const isFormData = data && data instanceof Object && data.constructor && data.constructor.name === 'FormData'
      if (isFormData && data.getHeaders) {
        Object.assign(headers, data.getHeaders())
      }

      // Execute the call.
      const resp = await axios(axiosCall).catch(err => {
        debug('NET', 'Request FAILED.', `${err}`)
        if (err.response) {
          return err.response
        }
        const message = `Network call failed: ${err}.`
        error(message)
        return {
          status: -1,
          success: false,
          data: {
            message
          }
        }
      })
      note('Net:', method, url, 'HTTP', resp.status)
      let defaultMessage
      switch (resp.status) {
        case -1:
          return resp
        case 200:
          return {
            status: 200,
            success: true,
            data: resp.data
          }
        case 204:
          return {
            status: 204,
            success: true,
            data: true
          }
        case 400:
          defaultMessage = 'Bad Request'
        // eslint-disable-next-line no-fallthrough
        case 401:
          defaultMessage = defaultMessage || 'Unauthorized'
        // eslint-disable-next-line no-fallthrough
        case 403:
          defaultMessage = defaultMessage || 'Forbidden'
        // eslint-disable-next-line no-fallthrough
        case 404:
          defaultMessage = defaultMessage || 'Not Found'
        // eslint-disable-next-line no-fallthrough
        case 500:
          defaultMessage = defaultMessage || 'Internal Server Error'
          error(`A call ${method} ${url} failed with ${resp.status}. Data:`)
          error(resp.data)
          return {
            status: resp.status,
            success: false,
            message: resp.data && resp.data.message ? resp.data.message : defaultMessage
          }
        default:
          warning(`Net: No handler for HTTP ${resp.status}.`)
          throw new Error(`Net library has no handler yet for status ${resp.status}.`)
      }
    }

    // Helper to process error situation.
    async function handleError(err): Promise<HttpResponse> {
      let status: SupportedFailStatus = 500
      // Let us see what we can do for the error.
      if (err.response) {
        switch (err.response.status) {
          case 401:
          case 403:
            status = err.response.status
            if (getConf(url, 'refreshToken') && getConf(url, 'refreshUrl')) {
              warning(`Request ${method} ${url} gave ${err.response.status} but trying to refresh the token.`)
              err = await refreshToken(url)
              if (err === true) {
                let success = true
                const retried = await doRequest({ method, url, data }).catch(newErr => {
                  warning(`We got token but retrying ${method} ${url} failed as well. Error was:`)
                  error(newErr)
                  err = newErr
                  status = 500
                  success = false
                })
                if (success) {
                  debug('NET', `Retrying ${method} ${url} successful.`)
                  return retried as HttpResponse
                }
              }
            }
            break
        }
      }
      // Nothing to do. Give up.
      let reason = ''
      if (err.response && err.response.data) {
        reason = ` (${err.response.data.message})`
      }
      error(`Request ${method} ${url} failed: ${JSON.stringify(err)}${JSON.stringify(reason)}`)
      return {
        status,
        success: false,
        message: `Request ${method} ${url} failed.`
      }
    }

    // Check if we have refresh token but no actual token or token has expired.
    const token = getConf(url, 'token')
    const hasRefreshToken = !!getConf(url, 'refreshToken')
    let needRefresh = hasRefreshToken && !token
    if (token) {
      try {
        const decoded: { exp: number } = jwtDecode(token as string)
        const expires = decoded.exp * 1000
        const now = new Date().getTime()
        if (expires - now < 1000) {
          debug('NET', 'Token has been expired.')
          needRefresh = true
        }
      } catch (err) {}
    }

    if (needRefresh) {
      debug('NET', 'Token needs refreshing.')
      const err = await refreshToken(url)
      if (err !== true) {
        error(`Trying to refresh token gave an error: ${err}`)
      }
    }

    // Finally the actual processing start here.
    const finalResult = await doRequest({ method, url, data }).catch(err => {
      return handleError(err)
    })
    if (!finalResult.success) {
      if (finalResult.status === 403 || finalResult.status === 401) {
        // Check if we can still fix the problem.
        return handleError({ response: finalResult })
      }
    }
    return finalResult
  }
}

/**
 * Refresh the token for the given site.
 * @param url
 */
async function refresh(url: Url): Promise<null | TokenPair> {
  const result = await refreshToken(url)
  if (result === true) {
    return {
      token: getConf(url, 'token') as Token,
      refresh: getConf(url, 'refreshToken') as Token
    }
  }
  error(`Token refresh for ${url} failed:`, result)
  return null
}

export const net = {
  configure,
  getConf,
  setConf,
  refresh,
  DELETE: createRequestHandler('DELETE'),
  GET: createRequestHandler('GET'),
  HEAD: createRequestHandler('HEAD'),
  PATCH: createRequestHandler('PATCH'),
  POST: createRequestHandler('POST'),
  PUT: createRequestHandler('PUT')
}
