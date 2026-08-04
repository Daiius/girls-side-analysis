import { afterEach, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

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

  // 日付は実装と同じく JST 固定で判定する。
  const jstToday = DateTime.now().setZone('Asia/Tokyo')
  const today = jstToday.toISODate()!
  const yesterday = jstToday.minus({ day: 1 }).toISODate()!

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

  it('一部のシリーズだけ申告しても、黙って捨てられずに記録される', async () => {
    // かつては 4 件揃っていない申告を if で握り潰していた（旧 prd/09 §2.2 D）。
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })
    await insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 2, state: 'プレイ済み' }],
    })

    const latest = await getLatestUserState(twitterID)
    expect(latest.find(s => s.series === 2)?.state).toBe('プレイ済み')
  })

  it('日をまたいで一部だけ申告しても、残りのシリーズが最新状態から消えない', async () => {
    // insertUserStatesIfUpdated は必ず「今日」で書くので、過去日の申告は直接作る。
    // 送られてこなかった series を補完せずに書くと、その日の行が歯抜けになり、
    // ユーザ単位の MAX(recorded_date) で最新日を決める getLatestUserState が
    // GS1/3/4 を見失う。
    await db.insert(userStates).values(
      [1, 2, 3, 4].map(series => ({
        twitterID,
        recordedDate: yesterday,
        series,
        status: '未プレイ',
      })),
    )

    await insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 2, state: 'プレイ済み' }],
    })

    const todayRows = await db.select().from(userStates)
      .where(and(
        eq(userStates.twitterID, twitterID),
        eq(userStates.recordedDate, today),
      ))
    expect(todayRows.length).toBe(4)

    const latest = await getLatestUserState(twitterID)
    expect(latest.length).toBe(4)
    expect(latest.find(s => s.series === 2)?.state).toBe('プレイ済み')
    expect(latest.find(s => s.series === 1)?.state).toBe('未プレイ')
    expect(latest.find(s => s.series === 3)?.state).toBe('未プレイ')
    expect(latest.find(s => s.series === 4)?.state).toBe('未プレイ')
  })

  it('一度も申告の無いシリーズが申告されたら記録される（GS5 が増えたとき）', async () => {
    // 最新状態に相手がいないので「変化なし」と誤判定して書き漏らしやすい。
    // series 番号を焼き込まない実装であることの確認でもある。
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })
    await insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 5, state: '実況視聴' }],
    })

    const latest = await getLatestUserState(twitterID)
    expect(latest.length).toBe(5)
    expect(latest.find(s => s.series === 5)?.state).toBe('実況視聴')
  })

  it('申告が空なら何も書かない', async () => {
    await insertUserStatesIfUpdated({ twitterID, data: [] })

    const rows = await db.select().from(userStates)
      .where(eq(userStates.twitterID, twitterID))
    expect(rows.length).toBe(0)
  })
})
