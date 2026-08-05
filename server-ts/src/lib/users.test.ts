import { afterEach, describe, expect, it, vi } from 'vitest'
import { and, DrizzleQueryError, eq } from 'drizzle-orm'
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

  it('別のシリーズを同時に申告しても、互いの変更を打ち消さない', async () => {
    // 補完のせいでこの関数は read-modify-write になっている。直列化しないと
    // 後に書く側が「読んだ時点の古い値」で相手の変更を潰す（lost update）。
    await insertUserStatesIfUpdated({ twitterID, data: allSeries('未プレイ') })

    await Promise.all([
      insertUserStatesIfUpdated({
        twitterID,
        data: [{ series: 1, state: 'プレイ済み' }],
      }),
      insertUserStatesIfUpdated({
        twitterID,
        data: [{ series: 2, state: '実況視聴' }],
      }),
    ])

    const latest = await getLatestUserState(twitterID)
    expect(latest.find(s => s.series === 1)?.state).toBe('プレイ済み')
    expect(latest.find(s => s.series === 2)?.state).toBe('実況視聴')
  })

  it('初回から別のシリーズを同時に申告しても、両方が記録される', async () => {
    // 行が 1 つも無い状態からの並行申告。補完元が無いので lost update は
    // 起こりようがないが、FOR UPDATE の gap lock 同士は競合しないため
    // INSERT への昇格でデッドロックしうる（＝ 500）。
    await Promise.all([
      insertUserStatesIfUpdated({
        twitterID,
        data: [{ series: 1, state: 'プレイ済み' }],
      }),
      insertUserStatesIfUpdated({
        twitterID,
        data: [{ series: 2, state: '実況視聴' }],
      }),
    ])

    const latest = await getLatestUserState(twitterID)
    expect(latest.find(s => s.series === 1)?.state).toBe('プレイ済み')
    expect(latest.find(s => s.series === 2)?.state).toBe('実況視聴')
  })

  it('申告が空なら何も書かない', async () => {
    await insertUserStatesIfUpdated({ twitterID, data: [] })

    const rows = await db.select().from(userStates)
      .where(eq(userStates.twitterID, twitterID))
    expect(rows.length).toBe(0)
  })
})

// デッドロックの再実行ループ（prd/04-voting.md §3.1）。
//
// 本物のデッドロックは初回同時申告の約 7% でしか起きないため、上の
// 「初回から別のシリーズを同時に申告しても、両方が記録される」だけでは
// 再実行ループの検算にならない（直す前でも大半の実行で通ってしまう）。
// ここだけエラーを注入して、ループの分岐そのものを決定的に確かめる。
//
// 🔑 **合成エラーは drizzle が実際に投げる形に合わせること。**
// 実測（2 接続で本物のデッドロックを起こして捕まえた中身）:
//   DrizzleQueryError { name: 'DrizzleQueryError', query, params, cause }  ← code は無い
//     └─ cause: Error { code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001',
//                       message: 'Deadlock found when trying to get lock; try restarting transaction' }
// 包み方は 1 段（drizzle-orm 1.0.0-rc.3 の mysql-core/session.ts）。
// `code` を最上位に直接載せた「それっぽい」エラーで検算すると、判定が
// cause を辿っていなくても通ってしまい、意味が無くなる（実際に一度踏んだ）。
describe('デッドロックの再実行（prd/04-voting.md §3.1）', () => {
  // twitter_id は varchar(20)（schema.ts）。長い ID にすると ER_DATA_TOO_LONG になる。
  const twitterID = 'userStatesRetry'

  afterEach(async () => {
    vi.restoreAllMocks()
    await db.delete(userStates).where(eq(userStates.twitterID, twitterID))
  })

  /** drizzle に包まれた ER_LOCK_DEADLOCK。上記の実測どおりの入れ子にする。 */
  const wrappedDeadlock = () =>
    new DrizzleQueryError(
      'insert into `UserStates` (`twitter_id`, `recorded_date`, `series`, `status`) values (?, ?, ?, ?)',
      [],
      Object.assign(
        new Error('Deadlock found when trying to get lock; try restarting transaction'),
        { code: 'ER_LOCK_DEADLOCK', errno: 1213, sqlState: '40001' },
      ),
    )

  it('包まれたデッドロックは再実行され、最終的に成功する', async () => {
    // 1 回目だけ失敗させる。spyOn は mockImplementationOnce を使い切ると
    // 本物の実装に戻るので、2 回目は実 DB に書かれる。
    const transaction = vi.spyOn(db, 'transaction')
      .mockImplementationOnce(() => Promise.reject(wrappedDeadlock()))

    await insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 1, state: 'プレイ済み' }],
    })

    expect(transaction).toHaveBeenCalledTimes(2)
    const latest = await getLatestUserState(twitterID)
    expect(latest.find(s => s.series === 1)?.state).toBe('プレイ済み')
  })

  it('デッドロックでないエラーは再実行せず、そのまま伝播する', async () => {
    // 再実行して意味があるのはデッドロックだけ。それ以外を 3 回流すと
    // 壊れた書き込みを 3 倍投げつけることになる。
    const error = new DrizzleQueryError(
      'insert into `UserStates` (`twitter_id`, `recorded_date`, `series`, `status`) values (?, ?, ?, ?)',
      [],
      Object.assign(new Error("Column 'status' cannot be null"), {
        code: 'ER_BAD_NULL_ERROR', errno: 1048, sqlState: '23000',
      }),
    )
    const transaction = vi.spyOn(db, 'transaction').mockRejectedValue(error)

    await expect(insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 1, state: 'プレイ済み' }],
    })).rejects.toBe(error)

    expect(transaction).toHaveBeenCalledTimes(1)
  })

  it('3 回とも失敗したら諦めて投げる（無限に流し直さない）', async () => {
    const error = wrappedDeadlock()
    const transaction = vi.spyOn(db, 'transaction').mockRejectedValue(error)

    await expect(insertUserStatesIfUpdated({
      twitterID,
      data: [{ series: 1, state: 'プレイ済み' }],
    })).rejects.toBe(error)

    expect(transaction).toHaveBeenCalledTimes(3)
  })
})
