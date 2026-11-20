import type { Server } from 'node:http'
import { serve } from '@hono/node-server'
import cron from 'node-cron'
import { app } from './app'
import { client } from './db'
import { aggregateYesterday } from './lib/aggregate'
import { installGracefulShutdown } from './lib/graceful-shutdown'

// `createServer` を渡していないので node:http の Server（戻り値の型は http2 との合併なので絞る）
const server = serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
}) as Server

// 停止の合図で、処理中のリクエストを終えてから DB のプールを閉じて終了する（prd/02 §6.5）。
// `client` は mysql2 の callback 版の Pool で `end()` は void を返すので、callback を Promise に包む
installGracefulShutdown({
  server,
  closers: [
    {
      name: 'db',
      close: () =>
        new Promise<void>((resolve, reject) =>
          client.end((error) => (error ? reject(error) : resolve())),
        ),
    },
  ],
})

// 毎日 00:01 JST に「昨日」の pair 集計（DailyOshiCount）を生成する。
// noOverlap で前回実行が長引いても多重起動しない。
// 失敗してもプロセスは落とさず、手動 endpoint（POST /admin/aggregate-day）で再実行できる。
const aggregateTask = cron.schedule(
  '1 0 * * *',
  async () => {
    try {
      const date = await aggregateYesterday()
      console.log(`DailyOshiCount aggregated for ${date}`)
    } catch (e) {
      console.error('aggregate cron failed:', e)
    }
  },
  { timezone: 'Asia/Tokyo', noOverlap: true },
)

// 停止の合図のあとに新しい集計を始めない（上の終了の手順とは別のリスナー）。
// すでに走っている集計は待たない。終了で切れたらトランザクションごと戻り、その日の分は手動で埋め直す（prd/05 §2.1）
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => aggregateTask.stop())
}
