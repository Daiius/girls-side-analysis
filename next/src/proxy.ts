import { NextRequest, NextResponse } from 'next/server'

const apiUrl = () =>
  process.env.API_URL ??
  (() => { throw new Error('process.env.API_URL is not defined!') })()

/**
 * 保護対象 path で session を server-ts に問い合わせ、未認証なら redirect。
 */
export default async function proxy(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? ''
  const res = await fetch(`${apiUrl()}/api/auth/get-session`, {
    method: 'GET',
    headers: { cookie, accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  const data = await res.json().catch(() => null)
  if (!data || !data.session) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile'],
}
