'use server'

import { db } from '../db';
import { votes, latestVotes, characters } from '../db/schema';
import {
  eq, ne, exists, and, max, count, desc, asc,
  lte
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

import type { Vote, DataSet } from '../types';

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
  maxDate?: string,
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
                eq(t1.votedDate, t2.votedDate),
                eq(t2.characterName, oshi),
              )
            )
        ),
        // 同じtwitterIDを持つVotesの中で、
        // 最もvotedDateが新しいものを取り出す操作
        eq(
          t1.votedDate,
          db.select({ latest_voted_date: max(t2.votedDate) })
            .from(t2)
            .where(
              eq(t1.twitterID, t2.twitterID)
            )
        ),
        // 推しキャラ以外のVotesを取り出す操作
        ne(t1.characterName, oshi),
        // maxDateが指定されている時、それ以前のデータに限定する操作（'YYYY-MM-DD'）
        maxDate ? lte(t1.votedDate, maxDate) : undefined,
      )
    )

    .groupBy(t1.characterName)
    .orderBy(desc(count(t1.characterName)));

};

/**
 * 指定されたキャラと「現在」同時に推されているキャラのランキングを取得します。
 *
 * 現在の推し set は LatestVotes が保持しているため、全 Votes 走査+MAX サブクエリは不要。
 * LatestVotes の self-join（同じ twitter_id 内）で oshi と共起するキャラを数えるだけ。
 * getVotesRelatedToOshi(maxDate 無し) と同じ結果を、はるかに軽いクエリで返す。
 */
export const getCurrentVotesRelatedToOshi = async (oshi: string) => {
  const l1 = alias(latestVotes, 'l1');
  const l2 = alias(latestVotes, 'l2');
  return await db
    .select({
      characterName: l1.characterName,
      count: count(l1.characterName),
    })
    .from(l1)
    .innerJoin(l2, eq(l1.twitterID, l2.twitterID))
    .where(
      and(
        eq(l2.characterName, oshi),
        ne(l1.characterName, oshi),
      )
    )
    .groupBy(l1.characterName)
    .orderBy(desc(count(l1.characterName)));
};

/**
 * 指定されたtwitterIDの現在の推し（最新投票）を取得します。
 * LatestVotes をそのまま引くだけ（MAX サブクエリ消滅）。
 */
export const getLatestVotes = async (twitterID: string) => {
  return await db
    .select({
      characterName: latestVotes.characterName,
      level: latestVotes.level,
    })
    .from(latestVotes)
    .where(eq(latestVotes.twitterID, twitterID))
    .orderBy(asc(latestVotes.level));
};

export const insertVotesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: Vote[];
}): Promise<{ updatedCharaNames: string[] }> => {
  const previousLatest = await getLatestVotes(twitterID);
  const isSame: boolean =
    // 長さが異なればそもそも再投票の対象
       previousLatest.length === data.length
    // 長さが同じだったとしても中身（キャラ名・レベル）を比較する
    && data.every(d =>
        previousLatest.some(lv =>
          lv.characterName === d.characterName && lv.level === d.level
        )
       );
    if (!isSame) {
      // 以前と投票内容が異なるのでDB更新。
      // Votes（履歴ログ）と LatestVotes（現在状態）を 1 トランザクションで更新する。
      // per-user の DELETE + INSERT は行ロックで自然に直列化されるため GET_LOCK 不要。
      const votedDate =
        DateTime.now().setZone('Asia/Tokyo').toISODate()!;
      await db.transaction(async (tx) => {
        // Votes: 当日分を置き換え（同日再投票に対応）
        await tx.delete(votes).where(
          and(
            eq(votes.twitterID, twitterID),
            eq(votes.votedDate, votedDate),
          )
        );
        await tx.insert(votes).values(
          data.map(d => ({ ...d, twitterID, votedDate }))
        );
        // LatestVotes: そのユーザ分を丸ごと置き換え
        await tx.delete(latestVotes)
          .where(eq(latestVotes.twitterID, twitterID));
        await tx.insert(latestVotes).values(
          data.map(d => ({
            twitterID,
            characterName: d.characterName,
            level: d.level,
            votedDate,
          }))
        );
      });

      const currentCharaNames = data.map(vote => vote.characterName)
      const lastCharaNames = previousLatest.map(lv => lv.characterName)

      // 削除されたキャラは、前の投票にはいるが今の投票にはいないキャラ
      const removedCharaNames = lastCharaNames.filter(lc => !currentCharaNames.includes(lc))

      // 投票ページを更新するべきは、
      // 1. 今の投票にいる全キャラクター
      // 2. 前の投票にいたキャラクター
      // の両方を含む必要がある

      return {
        updatedCharaNames: [
          ...currentCharaNames,
          ...removedCharaNames,
        ],
      }
    }

    return { updatedCharaNames: [] }
};

/**
 * 特定のキャラに関連する人気投票データを取得し、
 * {[関連キャラの名前]: 投票数} という辞書型を返します
 *
 * NOTE: 元は全キャラ分のデータを取得していましたが、特定キャラ向けにしました
 * この変更で動かなくなるコードを順次修正していきます......
 */
export const getLatestVotesForAnalysis = async (charaName: string) => {
  const oshiCombinationData = await getCurrentVotesRelatedToOshi(charaName);
  const oshiCombinationDataDict = oshiCombinationData
    .map(ocd => ({ [ocd.characterName]: ocd.count }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  return oshiCombinationDataDict;
};

/**
 * 全キャラににいて、それぞれのキャラに関連する人気投票データを取得し、
 * {[あるキャラ名]: {[関連キャラ名]: 投票数 }} というオブジェクトを返します
 *
 * NOTE: トップページの情報を生成するための処理ですが、非常に重いです
 * 一応更新を速やかに反映したいページではあるので、ISR系を使いつつ
 * 更新時間を長めに設定するのが良いと思われます
 */
export const getLatestVotesForAnalysisAll = async () => {
  const allCharacters = await db.select()
    .from(characters)
    .orderBy(
      asc(characters.sort), 
      asc(characters.series)
    );
  const dataPromise = allCharacters
    .map(async character => {
      const oshiCombinationData =
        await getCurrentVotesRelatedToOshi(character.name);
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

/**
 * 特定のキャラについて、30日間分の関連キャラ投票数を取得します
 *
 * NOTE: かなり重い処理です、1分に1回呼び出すのもちょっとまずいレベルです
 * 以前はトップページで全キャラ分のグラフも出していましたが、
 * 数秒間サーバのCPU使用率が200%（2コア分）になるのでやめました
 * 単一キャラ向けでもそれなりの負荷になります
 */
export const getTimelineData = async (characterName: string) => {
  const today = DateTime.now().endOf('day');
  const ndays = 30;
  
  // 累積データを見て表示するキャラ名を判断するので
  // 一度時系列データをすべて変数に保存する
  const dataBuffer = await Promise.all(
    [...Array(ndays)]
      .map((_, iday) => today.minus({ 'day': ndays-iday-1 })) // DateTimeへ
      .map(async date => await getVotesRelatedToOshi(
        characterName, date.toISODate() ?? undefined
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

