import { headers } from 'next/headers'

/**
 * server-ts (Hono) の better-auth エンドポイントに cookie を転送して
 * 現在のセッションを取得する。
 *
 * Server Component / Server Action / proxy.ts から呼び出される。
 * クライアント側からは authClient.useSession() を使う。
 */
export type SessionResponse = {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    twitterId: string | null
    createdAt: string
    updatedAt: string
  }
  session: {
    id: string
    token: string
    userId: string
    expiresAt: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    updatedAt: string
  }
}

const apiUrl = () =>
  process.env.API_URL ??
  (() => { throw new Error('process.env.API_URL is not defined!') })()

export const getSession = async (): Promise<SessionResponse | null> => {
  const reqHeaders = await headers()
  const cookie = reqHeaders.get('cookie') ?? ''
  if (!cookie) return null

  const res = await fetch(`${apiUrl()}/api/auth/get-session`, {
    method: 'GET',
    headers: { cookie, accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  // better-auth は session 無しの時 null を返す
  if (!data || !data.session) return null
  return data as SessionResponse
}
