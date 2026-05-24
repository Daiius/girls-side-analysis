import { db } from '../db';
import { userStates, userStatesMaster } from '../db/schema';
import { eq, max, and, asc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DateTime } from 'luxon';
//import { revalidatePath } from 'next/cache';

/**
 * 最新のユーザ状況データを取得します
 */
export const getLatestUserState = async (twitterID: string) => {
  const t1 = alias(userStates, 't1');
  const data = await db
    .select({ 
      series: userStates.series,
      state: userStates.status,
    })
    .from(userStates)
    .where(
      and(
        eq(userStates.twitterID, twitterID),
        eq(
          userStates.recordedDate,
          db.select({ latest_recorded_date: max(t1.recordedDate) })
            .from(t1)
            .where(
              eq(t1.twitterID, twitterID)
            )
        ),
      )
    );
  return data;
}

/**
 * プレイ状態の一覧を取得します
 */
export const getUserStatesMaster = async () =>
  await db.select()
    .from(userStatesMaster)
    .orderBy(asc(userStatesMaster.sort));

/**
 * 最新のプレイ状態と異なる状態が渡された場合のみ更新します
 */
export const insertUserStatesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: { series: number; state: string; }[];
}) => {
  const latestData = await getLatestUserState(twitterID);
  if (
       latestData.length === 0
    || latestData.some(ld => data.some(d => 
        d.series === ld.series && d.state !== ld.state
       ))
  ) {
    // 初投票のとき
    // or シリーズプレイ状況が変化したとき
    const gs1State = data.find(d => d.series === 1)?.state;
    const gs2State = data.find(d => d.series === 2)?.state;
    const gs3State = data.find(d => d.series === 3)?.state;
    const gs4State = data.find(d => d.series === 4)?.state;
    if (gs1State && gs2State && gs3State && gs4State) {
      // 一通りのシリーズプレイ結果が記録されているとき。
      // date 粒度の PK (twitter_id, recorded_date, series) は同日再更新で衝突する。
      // UserStates は常に series 1-4 の固定集合（行が増減しない）ので、
      // Votes のような DELETE+INSERT ではなく upsert（status のみ更新）で十分かつ簡潔。
      const recordedDate =
        DateTime.now().setZone('Asia/Tokyo').toISODate()!;
      await db.insert(userStates)
        .values([
          { twitterID, recordedDate, series: 1, status: gs1State },
          { twitterID, recordedDate, series: 2, status: gs2State },
          { twitterID, recordedDate, series: 3, status: gs3State },
          { twitterID, recordedDate, series: 4, status: gs4State },
        ])
        .onDuplicateKeyUpdate({
          set: { status: sql`values(${userStates.status})` },
        });
    }
  }
};

