'use server'

import { db } from '@/db';
import { votes } from '@/db/schema';
import { eq, ne, exists, and, max, count, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

export const getVotesRelatedToOshi = async (
  oshi: string
) => {
  const t1 = alias(votes, 't1');
  const t2 = alias(votes, 't2');
  // 推しキャラに関連するVotesのうち、
  // 同じtwitterIDを持つVotesのうちで最も新しいもののうち、
  // 推しキャラ以外の名前のデータを抜き出し、
  // 出現回数をカウントします
  return await db
    .select({
      characterName: t1.characterName,
      count: count(t1.characterName),
    })
    .from(t1)
    .where(
      and (
        // 推しキャラに関連するVotesを取り出す操作
        exists(
          db.select({ characterName: t2.characterName })
            .from(t2)
            .where(
              and(
                eq(t1.twitterID, t2.twitterID),
                eq(t1.votedTime, t2.votedTime),
                eq(t2.characterName, oshi),
              )
            )
        ),
        // 同じtwitterIDを持つVotesの中で、
        // 最もvotedTimeが新しいものを取り出す操作
        eq(
          t1.votedTime,
          db.select({ latest_voted_time: max(t2.votedTime) })
            .from(t2)
            .where(
              eq(t1.twitterID, t2.twitterID)
            )
        ),
        // 推しキャラ以外のVotesを取り出す操作
        ne(t1.characterName, oshi)
      )
    )
    .groupBy(t1.characterName)
    .orderBy(desc(count(t1.characterName)));

};

