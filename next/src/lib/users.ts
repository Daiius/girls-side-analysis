import { client } from './apiClient'

/**
 * 最新のユーザ状況データを取得します
 */
export const getLatestUserState = async (twitterId: string) => {
  const res = await client().users[':id'].$get({ param: { id: twitterId }})
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch /users/${twitterId} ${res.status} ${res.statusText}`)
}

/**
 * プレイ状態の一覧を取得します
 */
export const getUserStatesMaster = async () => {
  const res = await client().meta.users['status-types'].$get()
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch /meta/users/status-types ${res.status} ${res.statusText}`)
}

/**
 * 最新のプレイ状態と異なる状態が渡された場合のみ更新します
 */
export const insertUserStatesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: { series: number; state: string; }[];
}) => {
  const res = await client().users[':id'].$post({ 
    param: { id: twitterID },
    json: data,
  })
  if (!res.ok) {
    throw new Error(`failed to fetch /users/${twitterID} ${res.status} ${res.statusText}`)
  }
}

