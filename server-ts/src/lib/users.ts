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
 *
 * 仕様は prd/04-voting.md §3。series 番号はコードに焼き込まない
 * （妥当性の検証は呼び出し側。lib/validation.ts の findUnknownSeries）。
 */
export const insertUserStatesIfUpdated = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: { series: number; state: string; }[];
}) => {
  // 申告が空なら記録するものが無い。
  if (data.length === 0) return;

  const latestData = await getLatestUserState(twitterID);

  // 送られてきた series のうち 1 つでも「最新と違う」または「一度も申告が無い」なら書く。
  // 未申告を変更として数えないと、GS5 のような新しい series が初めて申告されたときに
  // 書き漏らす（最新状態と比較する相手が存在しないため）。
  const hasChange = data.some(d => {
    const latest = latestData.find(ld => ld.series === d.series);
    return latest === undefined || latest.state !== d.state;
  });
  if (!hasChange) return;

  // 投票は「全シリーズのプレイ状態を同時に申告する行為」（prd/04-voting.md §1）なので、
  // 送られてこなかった series は最新値で補完し、その日の行が常に全 series 揃うようにする。
  // getLatestUserState はユーザ単位の MAX(recorded_date) で最新日を 1 つ決めるため、
  // 一部の series しか無い日を作ると、書かなかった series が最新状態から消えてしまう。
  // 一度も申告されていない series は補完元が無いので書かない（未申告のまま）。
  const merged = new Map(latestData.map(ld => [ld.series, ld.state]));
  for (const d of data) merged.set(d.series, d.state);

  // date 粒度の PK (twitter_id, recorded_date, series) は同日再申告で衝突する。
  // 補完により行の集合は日をまたいでも変わらないので、Votes のような
  // DELETE+INSERT ではなく upsert（status のみ更新）で十分かつ簡潔。
  const recordedDate =
    DateTime.now().setZone('Asia/Tokyo').toISODate()!;
  await db.insert(userStates)
    .values(
      [...merged]
        .sort(([a], [b]) => a - b)
        .map(([series, status]) => ({ twitterID, recordedDate, series, status })),
    )
    .onDuplicateKeyUpdate({
      set: { status: sql`values(${userStates.status})` },
    });
};

