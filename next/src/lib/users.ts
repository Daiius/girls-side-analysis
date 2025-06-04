import { db } from '@/db';
import { userStates, userStatesMaster } from '@/db/schema';
import { eq, max, and, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
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
          userStates.recordedTime, 
          db.select({ latest_recorded_time: max(t1.recordedTime) })
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
      // 一通りのシリーズプレイ結果が記録されているとき
      await db.insert(userStates).values([
        { twitterID, series: 1, status: gs1State },
        { twitterID, series: 2, status: gs2State },
        { twitterID, series: 3, status: gs3State },
        { twitterID, series: 4, status: gs4State },
      ]);
    }
  }
};

