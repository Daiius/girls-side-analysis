import { client } from './apiClient'

/**
 * キャラデータの一覧を取得します
 */
export const getCharacters = async () => {
  const res = await client.characters.$get()
  if (res.ok) {
    return await res.json()
  }
  // TODO エラー処理をどうするかちゃんと検討したい
  throw new Error(`cannot fetch characters: ${res.status} ${res.statusText}`)
}

