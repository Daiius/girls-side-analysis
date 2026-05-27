import { headers as nextHeaders } from 'next/headers'

import { hc, type AppType } from '@daiius/girls-side-analysis-server-ts/client'

const apiKey = process.env.API_KEY
  ?? (() => { throw new Error('process.env.API_KEY is not defined') })()
const apiUrl = process.env.API_URL
  ?? (() => { throw new Error('process.env.API_URL is not defined') })()

const createCustomedFetch = (
  options?: NextFetchRequestConfig
): typeof fetch => async (
  input: RequestInfo | URL,
  requestInit?: RequestInit,
) => {
  const headers = new Headers(requestInit?.headers)
  headers.set('Authorization', `Bearer ${apiKey}`)
  return await fetch(input, { ...requestInit, headers, next: options })
}

export const client = (
  options?: NextFetchRequestConfig
) => hc<AppType>(apiUrl, { fetch: createCustomedFetch(options) })

// ユーザー固有データ（/votes/:id, /users/:id）用クライアント。
// API キーに加えてリクエストの cookie を server-ts へ転送し、
// server-ts 側でセッション（本人）検証を可能にする。
// cookie を読むためこのクライアントを使う呼び出しは動的レンダリングになる。
// 必ずセッション依存の文脈（Server Action / ログイン済みページ）からのみ使うこと。
const createAuthedFetch = (
  options?: NextFetchRequestConfig
): typeof fetch => async (
  input: RequestInfo | URL,
  requestInit?: RequestInit,
) => {
  const headers = new Headers(requestInit?.headers)
  headers.set('Authorization', `Bearer ${apiKey}`)
  const cookie = (await nextHeaders()).get('cookie') ?? ''
  if (cookie) headers.set('cookie', cookie)
  return await fetch(input, { ...requestInit, headers, next: options })
}

export const authedClient = (
  options?: NextFetchRequestConfig
) => hc<AppType>(apiUrl, { fetch: createAuthedFetch(options) })

