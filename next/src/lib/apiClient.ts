import type { AppType } from '../../../server-ts/src/index'
import { hc } from 'hono/client'

const apiKey = process.env.API_KEY
  ?? (() => { throw new Error('process.env.API_KEY is not defined') })()
const apiUrl = process.env.API_URL
  ?? (() => { throw new Error('process.env.API_URL is not defined') })()

const customedFetch: typeof fetch = async (
  input: RequestInfo | URL,
  requestInit?: RequestInit,
) => {
  const headers = new Headers(requestInit?.headers)
  headers.set('Authorization', `Bearer ${apiKey}`)
  return await fetch(input, { ...requestInit, headers })
}

export const client = hc<AppType>(apiUrl, { fetch: customedFetch })

