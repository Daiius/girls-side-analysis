'use server'
import { client } from './apiClient'
import { Vote } from '@/types';

import { revalidatePath } from 'next/cache'


/**
 * 指定されたtwitterIDに紐づけられた投票のうち、
 * 最新のものを取得します
 */
export const getLatestVotes = async (twitterID: string) => {
  const res = await client().votes[':id'].$get({ param: { id: twitterID } })
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /votes/${twitterID} ${res.status} ${res.statusText}`)
};

export const insertVotesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: Vote[];
}) => {
  const res = await client().votes[':id'].$post({
    param: { id: twitterID },
    json: data,
  })
  if (!res.ok) {
    throw new Error(`cannot fetch POST /votes/${twitterID} ${res.status} ${res.statusText}`)
  }
  const { updatedCharaNames } = await res.json()
  console.log(`updatingPages for: ${updatedCharaNames.join(',')}`)
  // ロジックミス、実際には関連するキャラが含まれる全部のページを更新しなければならない
  // ある人の投票に葉月珪が追加された時、
  // 更新が必要なのは葉月珪のページだけでなく、全キャラ
  for (const charaName of updatedCharaNames) {
    // NOTE: パーセントエンコードしてからrevalidatePathを呼ばないと、キャッシュが更新されません！
    //revalidatePath(`/${charaName}`)
    revalidatePath(`/${encodeURIComponent(charaName)}`)
  }
  // 変更されているキャラが一人でもいれば、トップページは再生成する
  // TODO 本当はトップページのデータも一部だけ更新すれば良いだけなので、キャッシュを上手く作る
  if (updatedCharaNames.length > 0) revalidatePath('/');
};

export const getLatestVotesForAnalysisAll = async () => {
  const res = await client().analysis.$get() 
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /analysis ${res.status} ${res.statusText}`)
};

export const getLatestVotesForAnalysis = async (charaName: string) => {
  const res = await client().analysis[':charaName'].$get({ param: { charaName }}) 
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /analysis/${charaName} ${res.status} ${res.statusText}`)
}

export const getTimelineData = async (charaName: string) => {
  const res = await client().timeline[':charaName'].$get({ param: { charaName }})
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /timeline/${charaName} ${res.status} ${res.statusText}`)
}

