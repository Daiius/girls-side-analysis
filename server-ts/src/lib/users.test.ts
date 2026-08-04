import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import { db } from '../db'
import { userStates } from '../db/schema'
import { getLatestUserState, insertUserStatesIfUpdated } from './users'

// プレイ状態（prd/04-voting.md §3）の統合テスト。
// arrange は各テストの中で組み、専用の twitterID を使って後始末する。

describe('プレイ状態の記録（prd/04-voting.md §3）', () => {
  const twitterID = 'userStatesTestUser'
  afterEach(async () => {
    await db.delete(userStates).where(eq(userStates.twitterID, twitterID))
  })

  const allSeries = (state: string) =>
    [1, 2, 3, 4].map(series => ({ series, state }))

  it('同じ日に 2 回申告したら、後の内容が採用される', async () => {
    // recorded_date は日付粒度なので、同じ日の 2 回目は PK
    // (twitter_id, recorded_date, series) が衝突する。status だけを
    // 上書きする upsert になっていることを確かめる。
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })
    await insertUserStatesIfUpdated({
      twitterID,
      data: [
        { series: 1, state: 'プレイ済み' },
        { series: 2, state: '未プレイ' },
        { series: 3, state: '未プレイ' },
        { series: 4, state: '未プレイ' },
      ],
    })

    const latest = await getLatestUserState(twitterID)
    expect(latest.length).toBe(4)
    expect(latest.find(s => s.series === 1)?.state).toBe('プレイ済み')
  })

  it('内容が変わらなければ行は増えない（1 日あたり series ごとに 1 行）', async () => {
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })

    const rows = await db.select().from(userStates)
      .where(eq(userStates.twitterID, twitterID))
    expect(rows.length).toBe(4)
  })
})
