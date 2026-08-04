import { afterEach, describe, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { db } from '../db'
import { dailyOshiCount, latestVotes, votes } from '../db/schema'
import type { DataSet } from '../types'
import {
  getLatestVotes,
  getLatestVotesForAnalysis,
  getTimelineData,
  insertVotesIfUpdated,
} from './votes'

// ⚠️ これは単体テストではなく実 MySQL に対する統合テストである（prd/05-analysis.md §7）。
// 正しさが SQL（self-join / ORDER BY / トランザクション）に宿っているため、
// DB をモックすると「自分が組み立てたクエリを書き写した」ことしか確認できない。
//
// arrange は各テストの中で組む（seed 非依存）。期待値の根拠がテストの中で読み切れるようにし、
// addTestData.ts の中身が変わってもテストが壊れないようにするため。
// seed が使うキャラ（柊夜ノ介 / 氷上格 / 紺野玉緒）は避け、専用の twitterID で作って後始末する。

/** LatestVotes（現在の推し set）をそのユーザ分だけ置き換える。level は並び順 = 0 始まり。 */
const setLatestVotes = async (
  twitterID: string,
  votedDate: string,
  picks: string[],
) => {
  await db.delete(latestVotes).where(eq(latestVotes.twitterID, twitterID))
  await db.insert(latestVotes).values(
    picks.map((characterName, level) => ({
      twitterID, votedDate, characterName, level,
    })),
  )
}

const cleanupUsers = async (twitterIDs: string[]) => {
  await db.delete(latestVotes).where(inArray(latestVotes.twitterID, twitterIDs))
  await db.delete(votes).where(inArray(votes.twitterID, twitterIDs))
}

describe('共起ランキングの並び順は決定的である（prd/05-analysis.md §4）', () => {
  // 同票のキャラの順序が実行ごとにブレると、グラフの色割り当てと凡例順が毎回変わる。
  // タイブレークを公式順（series, sort）に固定する、が仕様。
  const twitterIDs = ['detTestUser1', 'detTestUser2', 'detTestUser3']
  afterEach(async () => await cleanupUsers(twitterIDs))

  // ⚠️ 同票の 2 人は「公式順と名前順が食い違う」組を選ぶこと。
  //   天之橋一鶴 … series 1, sort 8   → 公式順では先
  //   佐伯瑛     … series 2, sort 1   → 名前（MySQL の照合順序・JS の文字コード順）では先
  // ORDER BY のタイブレークを外すと MySQL は概ね GROUP BY / PK の順（＝名前順）で返すため、
  // 公式順と名前順が一致する組（例: 三原色 と 白羽大地）を使うと、
  // **タイブレークを削除してもテストが通ってしまう**（実際に変異を当てて確認した）。
  const tieFirst = '天之橋一鶴'   // 公式順で先
  const tieSecond = '佐伯瑛'      // 名前順で先

  it('同票のキャラは公式順（series, sort）で並ぶ', async () => {
    // 姫条まどか(GS1) を推す 3 人。共起相手は
    //   天之橋一鶴 … 2 票
    //   佐伯瑛     … 2 票（同票）
    //   尽(series 1, sort 16) … 1 票
    await setLatestVotes('detTestUser1', '2025-03-01', ['姫条まどか', tieSecond, '尽'])
    await setLatestVotes('detTestUser2', '2025-03-01', ['姫条まどか', tieSecond, tieFirst])
    await setLatestVotes('detTestUser3', '2025-03-01', ['姫条まどか', tieFirst])

    const ranking = await getLatestVotesForAnalysis('姫条まどか')

    // 画面のランキングはこのオブジェクトの列挙順そのままで描画されるので、
    // キーの順序が仕様である（値だけを見ても決定性は検証できない）。
    expect(Object.keys(ranking)).toEqual([tieFirst, tieSecond, '尽'])
    expect(ranking).toEqual({ [tieFirst]: 2, [tieSecond]: 2, 尽: 1 })
  })

  it('自分の投票一覧は level 昇順、同 level なら公式順で並ぶ', async () => {
    // 同 level の 2 人を、名前順（= タイブレークを外したときに出てくる順）とは逆に並ぶよう置く。
    await db.insert(latestVotes).values([
      { twitterID: 'detTestUser1', votedDate: '2025-03-01', characterName: tieSecond, level: 1 },
      { twitterID: 'detTestUser1', votedDate: '2025-03-01', characterName: tieFirst, level: 1 },
      { twitterID: 'detTestUser1', votedDate: '2025-03-01', characterName: '姫条まどか', level: 0 },
    ])

    expect(await getLatestVotes('detTestUser1')).toEqual([
      { characterName: '姫条まどか', level: 0 },
      { characterName: tieFirst, level: 1 },
      { characterName: tieSecond, level: 1 },
    ])
  })
})

describe('投票の書き込み（prd/04-voting.md §2）', () => {
  const twitterID = 'writeTestUser'
  afterEach(async () => await cleanupUsers([twitterID]))

  const voteRows = async () =>
    await db.select().from(votes).where(eq(votes.twitterID, twitterID))

  it('前回と同じ内容なら書き込まず、更新対象も返さない', async () => {
    const data = [
      { characterName: '葉月珪', level: 0 },
      { characterName: '守村桜弥', level: 1 },
    ]
    await insertVotesIfUpdated({ twitterID, data })
    const before = await voteRows()

    const result = await insertVotesIfUpdated({ twitterID, data })

    expect(result.updatedCharaNames).toEqual([])
    expect(await voteRows()).toEqual(before)
  })

  it('同じ日に 2 回投票したら、その日の投票は後の内容に置き換わる', async () => {
    await insertVotesIfUpdated({
      twitterID,
      data: [
        { characterName: '葉月珪', level: 0 },
        { characterName: '守村桜弥', level: 1 },
        { characterName: '三原色', level: 2 },
      ],
    })
    await insertVotesIfUpdated({
      twitterID,
      data: [{ characterName: '葉月珪', level: 0 }],
    })

    // 同日分は積み増しではなく置き換え（3 件 → 1 件）
    expect((await voteRows()).map(r => r.characterName)).toEqual(['葉月珪'])
  })

  it('LatestVotes は現在の推し set に丸ごと置き換わる', async () => {
    await insertVotesIfUpdated({
      twitterID,
      data: [
        { characterName: '葉月珪', level: 0 },
        { characterName: '守村桜弥', level: 1 },
      ],
    })
    await insertVotesIfUpdated({
      twitterID,
      data: [
        { characterName: '三原色', level: 0 },
        { characterName: '姫条まどか', level: 1 },
      ],
    })

    expect(await getLatestVotes(twitterID)).toEqual([
      { characterName: '三原色', level: 0 },
      { characterName: '姫条まどか', level: 1 },
    ])
  })

  it('推しから外したキャラも更新対象に含まれる（そのキャラのページの票数も変わるため）', async () => {
    await insertVotesIfUpdated({
      twitterID,
      data: [
        { characterName: '葉月珪', level: 0 },
        { characterName: '守村桜弥', level: 1 },
      ],
    })

    const result = await insertVotesIfUpdated({
      twitterID,
      data: [
        { characterName: '葉月珪', level: 0 },
        { characterName: '三原色', level: 1 },
      ],
    })

    // 新しい推し（葉月珪・三原色）と、外した推し（守村桜弥）の両方
    expect([...result.updatedCharaNames].sort()).toEqual(
      ['三原色', '守村桜弥', '葉月珪'].sort(),
    )
  })
})

describe('時系列データの合成（prd/05-analysis.md §3）', () => {
  // 今日は LatestVotes の集計、過去日は夜間 cron が作った DailyOshiCount。
  // その 2 つを 30 日分の系列に合成するのが getTimelineData の仕事。
  const twitterID = 'timelineTestUser'
  const oshi = '蒼樹千晴'
  // today を 2025-06-30 に固定するので、窓は 2025-06-01（= today-29）〜 2025-06-30。
  const snapshotDates = ['2025-05-31', '2025-06-01', '2025-06-15']

  // DataSet.data は chart.js に合わせて number[] も許す型になっているが、
  // getTimelineData が返すのは必ず { x, y } の配列（実装の map を参照）。
  // テスト側で毎回 narrow するのは読みづらいので、ここで 1 回だけ絞る。
  const pointsOf = (dataset: DataSet) =>
    dataset.data as { x: string; y: number }[]

  /** x 軸ラベル（実装と同じ luxon の ja ロケール表記）から y を引く。 */
  const yAt = (dataset: DataSet, iso: string) =>
    pointsOf(dataset).find(
      p => p.x === DateTime.fromISO(iso).setLocale('ja').toLocaleString(),
    )?.y

  afterEach(async () => {
    vi.useRealTimers()
    await cleanupUsers([twitterID])
    await db.delete(dailyOshiCount)
      .where(inArray(dailyOshiCount.snapshotDate, snapshotDates))
  })

  const arrange = async () => {
    // ⚠️ Date だけを差し替える。mysql2 が内部で使うタイマーまで止めると
    // この後のクエリが返ってこなくなる。
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-06-30T12:00:00+09:00'))

    await db.insert(dailyOshiCount).values([
      // 窓の外（today-30）。混ざっていないことが分かるよう大きな値にしておく
      { snapshotDate: '2025-05-31', oshi, relatedChara: '天童壬', count: 99 },
      // 窓の最初の日（today-29）
      { snapshotDate: '2025-06-01', oshi, relatedChara: '天童壬', count: 3 },
      // 窓の途中。この 1 日しか出てこないキャラ（ゼロ埋めの確認用）
      { snapshotDate: '2025-06-15', oshi, relatedChara: '花椿吾郎', count: 1 },
    ])
    // 今日の分は DailyOshiCount ではなく LatestVotes から来る
    await setLatestVotes(twitterID, '2025-06-30', [oshi, '天童壬'])
  }

  it('過去日は DailyOshiCount、今日は LatestVotes から合成される', async () => {
    await arrange()

    const datasets = await getTimelineData(oshi)
    const tendou = datasets.find(d => d.label === '天童壬')!

    expect(yAt(tendou, '2025-06-01')).toBe(3)  // 過去日 = snapshot
    expect(yAt(tendou, '2025-06-30')).toBe(1)  // 今日 = LatestVotes の集計
  })

  // 📌 窓を決めているのは SQL の gte/lt ではなく、その後の「30 日分の days に
  // 引き当てる」合成の方。SQL の下限を外しても引き当てられないだけで挙動は変わらない
  // （変異検査で確認済み。あれは絞り込みの最適化であって仕様の境界ではない）。
  it('30 日窓の外の日は入らない', async () => {
    await arrange()

    const datasets = await getTimelineData(oshi)
    const tendou = datasets.find(d => d.label === '天童壬')!

    expect(pointsOf(tendou).length).toBe(30)
    expect(pointsOf(tendou)[0].x).toBe(
      DateTime.fromISO('2025-06-01').setLocale('ja').toLocaleString(),
    )
    expect(yAt(tendou, '2025-05-31')).toBeUndefined()
    // 窓の外に置いた 99 がどこにも現れない
    expect(Math.max(...pointsOf(tendou).map(p => p.y))).toBe(3)
  })

  it('投票の無い日は 0 で埋まる（線が途切れない）', async () => {
    await arrange()

    const datasets = await getTimelineData(oshi)
    const hanatsubaki = datasets.find(d => d.label === '花椿吾郎')!

    expect(pointsOf(hanatsubaki).length).toBe(30)
    expect(yAt(hanatsubaki, '2025-06-15')).toBe(1)
    expect(yAt(hanatsubaki, '2025-06-14')).toBe(0)
    expect(yAt(hanatsubaki, '2025-06-30')).toBe(0)
  })

  it('凡例の順序は窓内の合計票数の多い順', async () => {
    await arrange()

    const datasets = await getTimelineData(oshi)

    // 天童壬 = 3 + 1、花椿吾郎 = 1
    expect(datasets.map(d => d.label)).toEqual(['天童壬', '花椿吾郎'])
  })
})
