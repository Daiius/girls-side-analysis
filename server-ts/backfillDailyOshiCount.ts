// DailyOshiCount の過去日分を Votes から backfill する。
// 本番マイグレーション Phase 3、および cron 取りこぼし時のリカバリに使う。
//
// 実行: pnpm tsx backfillDailyOshiCount.ts [days]
//   days 省略時は 30。直近 days 日（昨日からさかのぼって days 日分、今日は含めない）を生成する。
//   今日分は LatestVotes 集計で表示するため DailyOshiCount には入れない。

import { DateTime } from 'luxon'

import { db, client } from './src/db'
import { aggregateOshiCountForDate } from './src/lib/aggregate'

const ndays = Number(process.argv[2] ?? 30)
if (!Number.isInteger(ndays) || ndays <= 0) {
  console.error(`invalid days: ${process.argv[2]}`)
  process.exit(1)
}

const today = DateTime.now().setZone('Asia/Tokyo')

try {
  for (let i = ndays; i >= 1; i--) {
    const targetDate = today.minus({ days: i }).toISODate()!
    console.log(`backfilling ${targetDate} ...`)
    await aggregateOshiCountForDate(db, targetDate)
  }
  console.log(`backfillDailyOshiCount done! (${ndays} days)`)
} finally {
  await client.end()
}
