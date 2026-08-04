import { afterEach, describe, expect, it } from 'vitest'
import { and, eq, inArray } from 'drizzle-orm'

import { db } from '../db'
import { dailyOshiCount, votes } from '../db/schema'
import { aggregateOshiCountForDate } from './aggregate'

// as-of 集計（prd/05-analysis.md §2）の統合テスト。
// 「その日時点の推し set」を Votes から復元できることが、時系列に歯抜けを作らない根拠になっている。
//
// ⚠️ aggregateOshiCountForDate は snapshot_date 単位で全ユーザ分を作り直すため、
// seed が backfill する 2023-12-01〜2024-01-04 とは重ならない日付を使う。
// アサートは自分が作った oshi に絞り、seed のユーザが混ざっても影響を受けないようにする。

const twitterID = 'asOfTestUser'
const oshi = '桜井琉夏'
const targetDates = ['2025-09-20', '2025-10-05']

/** Votes（履歴ログ）にその日の投票を積む。level は picks の並び順 = 0 始まり。 */
const recordVotes = async (votedDate: string, picks: string[]) =>
  await db.insert(votes).values(
    picks.map((characterName, level) => ({
      twitterID, votedDate, characterName, level,
    })),
  )

/**
 * 指定日の snapshot から、その oshi の共起相手と票数を { 名前: 票数 } で読み出す。
 * 行の並びではなく中身を確かめたいので、順序に依存しない形にする
 * （DailyOshiCount の並び順は読み出し側の getTimelineData が明示的に決める）。
 */
const snapshotOf = async (snapshotDate: string) => {
  const rows = await db
    .select({
      relatedChara: dailyOshiCount.relatedChara,
      count: dailyOshiCount.count,
    })
    .from(dailyOshiCount)
    .where(
      and(
        eq(dailyOshiCount.snapshotDate, snapshotDate),
        eq(dailyOshiCount.oshi, oshi),
      ),
    )
  return Object.fromEntries(rows.map(r => [r.relatedChara, r.count]))
}

describe('as-of 集計（prd/05-analysis.md §2）', () => {
  afterEach(async () => {
    await db.delete(votes).where(eq(votes.twitterID, twitterID))
    await db.delete(dailyOshiCount)
      .where(inArray(dailyOshiCount.snapshotDate, targetDates))
  })

  it('投票しない日が続いても、最後の投票がその日の推しとして数えられる', async () => {
    // 9/1 に投票したきり、以降は投票していないユーザ。
    await recordVotes('2025-09-01', [oshi, '設楽聖司'])

    // 19 日後の snapshot にも、その set が反映される（歯抜けにならない）
    await aggregateOshiCountForDate(db, '2025-09-20')

    expect(await snapshotOf('2025-09-20')).toEqual({ 設楽聖司: 1 })
  })

  it('その日より後の投票は混ざらない（過去日を後から正しく再現できる）', async () => {
    await recordVotes('2025-09-01', [oshi, '設楽聖司'])
    // 9/20 より後に推しを変えている
    await recordVotes('2025-10-01', [oshi, '蓮見達也'])

    await aggregateOshiCountForDate(db, '2025-09-20')
    await aggregateOshiCountForDate(db, '2025-10-05')

    // 9/20 時点は変更前の set のまま
    expect(await snapshotOf('2025-09-20')).toEqual({ 設楽聖司: 1 })
    // 10/05 時点は変更後の set
    expect(await snapshotOf('2025-10-05')).toEqual({ 蓮見達也: 1 })
  })

  it('同じ日を何度集計しても結果は変わらない（cron の再実行・backfill が安全）', async () => {
    await recordVotes('2025-09-01', [oshi, '設楽聖司', '蓮見達也'])

    await aggregateOshiCountForDate(db, '2025-09-20')
    const first = await snapshotOf('2025-09-20')
    await aggregateOshiCountForDate(db, '2025-09-20')
    const second = await snapshotOf('2025-09-20')

    expect(second).toEqual(first)
    // 積み増しではなく作り直しなので、票数が二重に数えられることもない
    expect(second).toEqual({ 設楽聖司: 1, 蓮見達也: 1 })
  })
})
