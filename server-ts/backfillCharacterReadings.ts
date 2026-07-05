// Characters.reading を charactersMaster.ts の内容で埋める。
//
// addTestData.ts は既存データがあるとスキップするため、稼働中の DB に
// reading カラムを後付けした場合はこのスクリプトで backfill する。
// 冪等（何度実行しても同じ結果になる）。
//
// 実行: pnpm tsx backfillCharacterReadings.ts

import { eq } from 'drizzle-orm'

import { db, client } from './src/db'
import { characters } from './src/db/schema'
import { charactersMaster } from './charactersMaster'

try {
  let updated = 0
  for (const c of charactersMaster) {
    const [result] = await db.update(characters)
      .set({ reading: c.reading })
      .where(eq(characters.name, c.name))
    if (result.affectedRows === 0) {
      // マスタ側にだけ存在する名前は挿入せず警告に留める
      // （DB のキャラ追加は seed / 手動運用の管轄）
      console.warn(`not found in DB, skipped: ${c.name}`)
    } else {
      updated += result.affectedRows
    }
  }
  console.log(`backfillCharacterReadings done! (${updated} rows updated)`)
} finally {
  await client.end()
}
