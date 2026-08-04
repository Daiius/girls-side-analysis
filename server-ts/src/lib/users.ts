import { db } from '../db';
import { userStates, userStatesMaster } from '../db/schema';
import { eq, max, and, asc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DateTime } from 'luxon';
//import { revalidatePath } from 'next/cache';

/**
 * db 本体とトランザクションのどちらでも同じクエリを流せるようにするための型。
 */
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * 最新のユーザ状況データを取得します
 *
 * 補完のための read-modify-write（insertUserStatesIfUpdated）から呼ぶときは、
 * ロックを共有するために同じトランザクションを executor として渡すこと。
 */
export const getLatestUserState = async (
  twitterID: string,
  executor: Executor = db,
) => {
  const t1 = alias(userStates, 't1');
  const data = await executor
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

  // ⚠️ 初回申告（行が 1 つも無い）では FOR UPDATE がデッドロックしうる（下記）。
  // その場合 InnoDB は片方を rollback 済みにして返すので、そのまま流し直せばよい。
  // 2 回目には勝った側の行が commit されており、FOR UPDATE が gap ではなく
  // 実レコードを掴む＝以降は素直に直列化されるため、3 回も試せば十分。
  for (let attempt = 1; ; attempt++) {
    try {
      await writeUserStates({ twitterID, data });
      return;
    } catch (e) {
      if (attempt >= 3 || !isDeadlock(e)) throw e;
    }
  }
};

/**
 * InnoDB のデッドロック。検出時点でそのトランザクションは rollback 済みなので、
 * 呼び出し側は安全に再実行できる。
 */
const isDeadlock = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && 'code' in e
  && (e as { code?: unknown }).code === 'ER_LOCK_DEADLOCK';

/**
 * insertUserStatesIfUpdated の本体（1 トランザクション）。
 */
const writeUserStates = async ({
  twitterID,
  data,
}: {
  twitterID: string;
  data: { series: number; state: string; }[];
}) => {
  // ⚠️ 補完（下記）があるため、この処理は read-modify-write である。
  // Votes は受信データだけで書けるので「per-user の行ロックで自然に直列化される」
  // （prd/04-voting.md §2.2）が、こちらは読んだ値を書き戻すのでそれでは足りない。
  // 同じユーザから別々の series が並行して申告されると、後に書く側が
  // 「読んだ時点の古い値」で相手の変更を潰す（lost update）。
  // ユーザの行をまとめて FOR UPDATE で押さえ、read-modify-write を直列化する。
  await db.transaction(async (tx) => {
    // ⚠️ これで直列化できるのは**行が既にある**ときだけ。行が 1 つも無いと
    // 掴めるのは gap lock で、gap lock 同士は競合しないため両者が通り抜け、
    // INSERT への昇格でデッドロックする（2 接続で実測。ER_LOCK_DEADLOCK）。
    // ただし補完元が無い＝各自の series しか書かないので、
    // **初回申告に lost update は起こりえない**。デッドロックだけを
    // 呼び出し側の再実行で吸収すれば足りる。
    await tx.select({ series: userStates.series })
      .from(userStates)
      .where(eq(userStates.twitterID, twitterID))
      .for('update');

    const latestData = await getLatestUserState(twitterID, tx);

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
    await tx.insert(userStates)
      .values(
        [...merged]
          .sort(([a], [b]) => a - b)
          .map(([series, status]) => ({ twitterID, recordedDate, series, status })),
      )
      .onDuplicateKeyUpdate({
        set: { status: sql`values(${userStates.status})` },
      });
  });
};

