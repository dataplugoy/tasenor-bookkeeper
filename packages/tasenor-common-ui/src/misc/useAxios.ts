import { Dispatch, SetStateAction, useEffect } from 'react'
import axios from 'axios'

export type AxiosProps<Type> = {
  url: string | null,
  token?: string,
  receiver: Dispatch<SetStateAction<Type>|null>
}

/**
 * Helper hook to call API using axios.
 * @param props
 */
export function useAxios<Type>(props: AxiosProps<Type>) {
  const { token, url, receiver } = props
  useEffect(() => {
    if (url === null) {
      receiver(null)
      return
    }
    let gone = false
    const headers: { Authorization?: string } = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    axios({ method: 'GET', url, headers })
      .then(resp => !gone && receiver(resp.data as Type))
      .catch(err => console.error('Axios:', err))

    return () => {
      gone = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, url])
}
