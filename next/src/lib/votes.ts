import { client } from './apiClient'
import { Vote } from '@/types';

import { revalidatePath } from 'next/cache'


/**
 * 指定されたtwitterIDに紐づけられた投票のうち、
 * 最新のものを取得します
 */
export const getLatestVotes = async (twitterID: string) => {
  const res = await client.votes[':id'].$get({ param: { id: twitterID } })
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
  const res = await client.votes[':id'].$post({
    param: { id: twitterID },
    json: data,
  })
  if (!res.ok) {
    throw new Error(`cannot fetch POST /votes/${twitterID} ${res.status} ${res.statusText}`)
  }
  const { updatedCharaNames } = await res.json()
  for (const charaName of updatedCharaNames) {
    revalidatePath(`/${charaName}`)
  }
};

export const getLatestVotesForAnalysisAll = async () => {
  const res = await client.analysis.$get() 
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /analysis ${res.status} ${res.statusText}`)
};

export const getLatestVotesForAnalysis = async (charaName: string) => {
  const res = await client.analysis[':charaName'].$get({ param: { charaName }}) 
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /analysis/${charaName} ${res.status} ${res.statusText}`)
}

export const getTimelineData = async (charaName: string) => {
  const res = await client.timeline[':charaName'].$get({ param: { charaName }})
  if (res.ok) {
    return await res.json()
  }
  throw new Error(`cannot fetch GET /timeline/${charaName} ${res.status} ${res.statusText}`)
}

