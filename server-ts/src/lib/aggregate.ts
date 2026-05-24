import type { MySql2Database } from 'drizzle-orm/mysql2'
import { sql, eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { db } from '../db'
import { dailyOshiCount } from '../db/schema'

/**
 * 指定日（`targetDate`, 'YYYY-MM-DD'）終了時点の pair 集計を DailyOshiCount に書き込む。
 *
 * Votes から「各ユーザの voted_date <= targetDate のうち最新日の set」を取り出し、
 * その self-join で oshi × related_chara の共起数を数える。
 * 投票が歯抜けでも MAX(voted_date) で「その日時点の現在状態」を正しく復元できる。
 *
 * executor を引数に取ることで、本番（src/db の db）と seed スクリプト（独自接続）の
 * どちらからも使える。
 */
export const aggregateOshiCountForDate = async (
  database: MySql2Database<any>,
  targetDate: string,
) => {
  await database.transaction(async (tx) => {
    // 再実行（リカバリ・backfill）に備えて当日分を消してから入れ直す。
    await tx.delete(dailyOshiCount)
      .where(eq(dailyOshiCount.snapshotDate, targetDate))

    await tx.execute(sql`
      INSERT INTO DailyOshiCount (snapshot_date, oshi, related_chara, count)
      WITH latest_per_user AS (
        SELECT v.twitter_id, v.character_name
        FROM Votes v
        WHERE v.voted_date = (
          SELECT MAX(v2.voted_date) FROM Votes v2
          WHERE v2.twitter_id = v.twitter_id
            AND v2.voted_date <= ${targetDate}
        )
      )
      SELECT ${targetDate}, l1.character_name, l2.character_name, COUNT(*)
      FROM latest_per_user l1
      JOIN latest_per_user l2 USING (twitter_id)
      WHERE l1.character_name <> l2.character_name
      GROUP BY l1.character_name, l2.character_name
    `)
  })
}

/**
 * 「昨日」（Asia/Tokyo）の集計を DailyOshiCount に書き込む（夜間 cron 用）。
 * date を渡せば任意日のリカバリにも使える。
 */
export const aggregateYesterday = async (date?: string) => {
  const targetDate = date
    ?? DateTime.now().setZone('Asia/Tokyo').minus({ days: 1 }).toISODate()!
  await aggregateOshiCountForDate(db, targetDate)
  return targetDate
}
