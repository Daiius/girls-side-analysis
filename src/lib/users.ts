import { db } from '@/db';
import { userStates, userStatesMaster } from '@/db/schema';
import { eq, max, and, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

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

export const getUserStatesMaster = async () =>
  await db.select()
    .from(userStatesMaster)
    .orderBy(asc(userStatesMaster.sort));

