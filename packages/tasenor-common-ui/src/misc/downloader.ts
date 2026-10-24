/**
 * Download and save given URL as a file.
 * @param url
 * @param token
 */
export const downloadUrl = async (url: string, token?: string, fileName?: string): Promise<void> => {
  const headers: HeadersInit = token ? { Authorization: 'Bearer ' + token } : {}
  return fetch(url, {
    method: 'GET',
    headers: new Headers(headers)
  })
    .then(async response => {
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data && data.message ? data.message : `Download failed with HTTP ${response.status}.`)
      }
      const disposition = response.headers.get('Content-Disposition')
      if (disposition && !fileName) {
        const match = /^.*?filename="(.*)"$/.exec(disposition)
        if (match) {
          fileName = match[1]
        }
      }
      return response.blob()
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.download = fileName as string
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    })
}
