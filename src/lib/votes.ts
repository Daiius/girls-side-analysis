'use server'

import { db } from '@/db';
import { votes, characters } from '@/db/schema';
import { 
  eq, ne, exists, and, max, count, desc, asc,
  lte
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import { Vote, DataSet } from '@/types';

import { DateTime } from 'luxon';

/** 
 * 指定されたキャラと同時に推されるキャラの
 * ランキングを取得します
 *
 * 推しキャラに関連するVotesのうち、
 * 同じtwitterIDを持つVotesのうちで最も新しいもののうち、
 * 推しキャラ以外の名前のデータを抜き出し、
 * 出現回数をカウントします
 */
export const getVotesRelatedToOshi = async (
  oshi: string,
  maxDate?: Date,
) => {
  const t1 = alias(votes, 't1');
  const t2 = alias(votes, 't2');
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
        ne(t1.characterName, oshi),
        // maxDateが指定されている時、それ以前のデータに限定する操作
        maxDate ? lte(t1.votedTime, maxDate) : undefined,
      )
    )
    .groupBy(t1.characterName)
    .orderBy(desc(count(t1.characterName)));

};

/**
 * 指定されたtwitterIDに紐づけられた投票のうち、
 * 最新のものを取得します
 */
export const getLatestVotes = async (twitterID: string) => {
  const t1 = alias(votes, 't1');
  return await db
    .select({
      characterName: votes.characterName,
      level: votes.level,
    })
    .from(votes)
    .where(
      and(
        eq(votes.twitterID, twitterID),
        eq(
          votes.votedTime,
          db.select({ max_voted_time: max(t1.votedTime) })
            .from(t1)
            .where(eq(t1.twitterID, twitterID))
        )
      )
    ).orderBy(asc(votes.level))
};

export const insertVotesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: Vote[];
}) => {
  const latestVotes = await getLatestVotes(twitterID);
  const isSame: boolean = 
    // 長さが異なればそもそも再投票の対象
       latestVotes.length === data.length 
    // 長さが同じだったとしても中身を比較する
    && data.every(d =>
        latestVotes.some(lv =>
          Object.keys(lv).every(key => 
            d[key as keyof Vote] === lv[key as keyof Vote]
          )
        )
       );
    if (!isSame) {
      await db
        .insert(votes)
        .values(
          data.map(d => ({ ...d, twitterID }))
        );
    }
};

export const getLatestVotesForAnalysis = async () => {

  const allCharacters = await db.select()
    .from(characters)
    .orderBy(
      asc(characters.sort), 
      asc(characters.series)
    );

  const dataPromise = allCharacters
    .map(async character => {
      const oshiCombinationData =
        await getVotesRelatedToOshi(character.name);
      const oshiCombinationDataDict = oshiCombinationData
        .map(ocd => ({ [ocd.characterName]: ocd.count }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      return oshiCombinationData.length > 0
        ? {
            [character.name]: oshiCombinationDataDict
          }
        : {};
    });
  const data = await Promise.all(dataPromise);
  const result = data
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  return result;
};

export const getTimelineData = async (characterName: string) => {
  const today = DateTime.now().endOf('day');
  const ndays = 30;
  
  // 累積データを見て表示するキャラ名を判断するので
  // 一度時系列データをすべて変数に保存する
  const dataBuffer = await Promise.all(
    [...Array(ndays)]
      .map((_, iday) => today.minus({ 'day': ndays-iday-1 })) // DateTimeへ
      .map(async date => await getVotesRelatedToOshi(
        characterName, date.toJSDate()
      ))
  );

  // データに含まれるキャラ名を重複なく取得する
  const allRelatedCharacters = [...new Set(
    dataBuffer.flatMap(periodicData =>
      periodicData.map(d => d.characterName)
    )
  )];

  // キャラ毎の推移
  const datasets: DataSet[] = allRelatedCharacters
    .map(character => ({
      label: character,
      data:
        dataBuffer.map((periodicData, iperiodicData) => {
          const x: string = today
            .minus({ 'day': ndays - iperiodicData - 1})
            .setLocale('ja')
            .toLocaleString();
          const characterData = periodicData.find(d =>
            d.characterName === character
          );
          return { x, y: (characterData?.count ?? 0) };
        })
    }));

  return datasets;
}

