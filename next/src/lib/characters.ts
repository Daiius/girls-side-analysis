import type { AppType } from '../../../server-ts/src/index'
import { hc } from 'hono/client'

/**
 * キャラデータの一覧を取得します
 */
export const getCharacters = async () => {
  const client = hc<AppType>(process.env.API_URL!)
  const res = await client.characters.$get()
  if (res.ok) {
    return await res.json()
  }
  // TODO エラー処理をどうするかちゃんと検討したい
  throw new Error(`cannot fetch characters: ${res.status} ${res.statusText}`)
}

