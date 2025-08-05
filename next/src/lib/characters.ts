import { client } from './apiClient'

/**
 * キャラデータの一覧を取得します
 * このAPIの応答は滅多に変わらないはずなので、1日キャッシュします
 */
export const getCharacters = async () => {
  const res = await client({ revalidate: 86400 }).characters.$get()
  if (res.ok) {
    return await res.json()
  }
  // TODO エラー処理をどうするかちゃんと検討したい
  throw new Error(`cannot fetch characters: ${res.status} ${res.statusText}`)
}

