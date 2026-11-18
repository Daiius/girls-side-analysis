// `GET /version`（prd/07-api.md §2.2）: 認証なし・DB に触れずに、イメージの ENV から入れた版を返す。
//
// app.ts は import した時点の env で版を読むので、env を差し替えてからモジュールを読み直す。
// 認証（better-auth）は差し替える。本物は X OAuth の資格情報などを import 時に要求するため。
// セッションの取得が呼ばれないことも、これで確かめる。この検査は DB に繋がない
// （db のプールは import しただけでは接続しない）。

import { afterEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn(async () => null)

vi.mock('./lib/auth', () => ({
  auth: { api: { getSession }, handler: () => new Response(null, { status: 404 }) },
}))

const versionKeys = ['GIT_COMMIT', 'BUILD_TIME', 'GIT_DIRTY'] as const
// app.ts が import 時に要求する env（テストの実行環境には無い）。
const appEnv = { API_KEY: 'test-api-key', BETTER_AUTH_URL: 'http://localhost:3000' }
const keys = [...versionKeys, ...Object.keys(appEnv)]
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]))

function setEnv(env: Record<string, string | undefined>) {
  for (const k of keys) delete process.env[k]
  for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v
}

async function loadApp(env: Record<string, string | undefined>) {
  setEnv({ ...appEnv, ...env })
  vi.resetModules()
  getSession.mockClear()
  const { app } = await import('./app')
  return app
}

afterEach(() => setEnv(saved))

const sha = 'aa0922b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7'

describe('GET /version', () => {
  it('ビルド引数の値を返す', async () => {
    const app = await loadApp({
      GIT_COMMIT: sha,
      BUILD_TIME: '2026-10-30T01:02:03Z',
      GIT_DIRTY: 'true',
    })
    const res = await app.request('/version')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      commit: sha,
      builtAt: '2026-10-30T01:02:03.000Z',
      dirty: true,
    })
  })

  it('ビルド引数が無ければ unknown', async () => {
    const app = await loadApp({})
    const res = await app.request('/version')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ commit: 'unknown', builtAt: 'unknown', dirty: false })
  })

  it('API キーが無くても読める（ほかの経路は 401 のまま）', async () => {
    const app = await loadApp({})
    const res = await app.request('/version', { headers: { cookie: 'gsa.session_token=whatever' } })
    expect(res.status).toBe(200)
    expect(getSession).not.toHaveBeenCalled()

    // 対照: API キー認証は外れていない。ハンドラに届く前に 401 で返る。
    expect((await app.request('/characters')).status).toBe(401)
    expect((await app.request('/')).status).toBe(401)
    // 似たパスまで素通しにしていない。
    expect((await app.request('/version/')).status).toBe(401)
    expect((await app.request('/versions')).status).toBe(401)
  })

  it('GET 以外は API キー認証に掛かる', async () => {
    const app = await loadApp({})
    expect((await app.request('/version', { method: 'POST' })).status).toBe(401)
  })
})
