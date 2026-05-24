import { serve } from '@hono/node-server'
import cron from 'node-cron'
import { app } from './app'
import { aggregateYesterday } from './lib/aggregate'

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

// 毎日 00:01 JST に「昨日」の pair 集計（DailyOshiCount）を生成する。
// noOverlap で前回実行が長引いても多重起動しない。
// 失敗してもプロセスは落とさず、手動 endpoint（POST /admin/aggregate-day）で再実行できる。
cron.schedule(
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
