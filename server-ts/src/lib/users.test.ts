import { afterAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import { db } from '../db'
import { userStates } from '../db/schema'
import {
  getLatestUserState,
  getUserStatesMaster,
  insertUserStatesIfUpdated,
} from './users'

// addTestData.ts の seed（決定的）に対する現状ロジックの出力を凍結する。
describe('users.ts（現状ロジックの baseline snapshot）', () => {
  const bySeries = <T extends { series: number }>(rows: T[]) =>
    [...rows].sort((a, b) => a.series - b.series)

  describe('getLatestUserState', () => {
    it('testID の最新状態', async () => {
      expect(bySeries(await getLatestUserState('testID'))).toMatchSnapshot()
    })
    it('testID2 の最新状態', async () => {
      expect(bySeries(await getLatestUserState('testID2'))).toMatchSnapshot()
    })
  })

  describe('getUserStatesMaster', () => {
    it('プレイ状態マスタ', async () => {
      expect(await getUserStatesMaster()).toMatchSnapshot()
    })
  })
})

// 回帰テスト：date 化で recorded_date が当日固定になったため、
// 同日に状態を再更新すると PK (twitter_id, recorded_date, series) 衝突で落ちていた。
// 当日分を DELETE+INSERT で置き換える修正が効いていることを確認する。
// snapshot 群を汚さないよう専用 twitterID を使い、後始末する。
describe('insertUserStatesIfUpdated（同日再更新）', () => {
  const twitterID = 'testWriterUserStates'
  afterAll(async () => {
    await db.delete(userStates).where(eq(userStates.twitterID, twitterID))
  })

  it('同日に2回更新しても PK 衝突せず最新状態へ置き換わる', async () => {
    await insertUserStatesIfUpdated({
      twitterID,
      data: [
        { series: 1, state: '未プレイ' },
        { series: 2, state: '未プレイ' },
        { series: 3, state: '未プレイ' },
        { series: 4, state: '未プレイ' },
      ],
    })
    // 同日に series1 を変更して再更新（旧実装ではここで PK 衝突）
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
})
