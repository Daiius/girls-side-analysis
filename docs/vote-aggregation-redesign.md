# 投票データ集計の改修（設計と実装）

ブランチ: `feature/vote-aggregation-redesign`
（旧 `feature/daily-oshi-count-performance-improvements` の計画を現状に合わせて改訂・実装）

## 状態（2026-05-24）

元の計画は 2026-05-16 に `feature/daily-oshi-count-performance-improvements` ブランチで策定したが、
実装には未着手のまま main が 31 コミット進み、その間に **next-auth → better-auth 移行が完了**した（PR #63、main マージ済み）。
本ドキュメントは元計画を現在の main に合わせて改訂し、**着手リスト 1〜14（アプリ実装・テスト・移行スクリプト）まで実装済み**の状態を反映したもの。
コード例・SQL は実装に合わせてある。残りは 15〜19 の本番デプロイ手順（手動作業）。

**結論：計画の中核（twitter_id ベースの 3 テーブル設計）はそのまま有効だった。** better-auth 移行は
`Votes` / `UserStates` テーブルには一切触れておらず、認証テーブル（`user`/`session`/`account`/`verification`）の
追加と `twitterId` 取得経路の変更のみ。投票は引き続き `twitter_id` をキーにしている。

実装上で確定した主な設計判断（元計画からの変更）：
- **集計は LatestVotes ではなく Votes の「as-of date 最新 set」から計算**（cron も backfill も `aggregateOshiCountForDate` を共用、歯抜け・catch-up に強い）
- **UserStates の同日再更新は upsert（`ON DUPLICATE KEY UPDATE`）**で吸収（series 1-4 固定集合のため。Votes は推し増減があるので DELETE+INSERT）
- **ランキング/凡例の同値時ソートは公式順 `(characters.series, characters.sort)`**（`characters` を join）
- 手動 endpoint は独自 `CRON_API_KEY` 不要（既存 `API_KEY` ミドルウェアで保護）

## 背景

現状の `Votes` テーブル単一で全集計を行う設計が、以下の理由で重い：

- `getVotesRelatedToOshi` が 3 段ネストの EXISTS + MAX(voted_time) サブクエリで、`Votes` 全行スキャンを誘発
- トップページ：全キャラ × 上記クエリ（`getLatestVotesForAnalysisAll`）
- キャラ個別ページ：30 日グラフで 30 回呼び出し（`getTimelineData`）
- 投票更新頻度は低い（read >> write）のに、毎 read で「最新投票」を計算し直している

これを read 中心ワークロード向けに再設計する。将来 GS5 リリースなどで read が増えても耐える構造にしたい。

## 設計の核心

**3 テーブル構成 + 役割分担**：

| テーブル | 役割 | 書き込みタイミング |
|---|---|---|
| `Votes` | 全投票履歴の不変ログ（日単位） | 投票時に当日分を DELETE + INSERT |
| `LatestVotes`（新設） | ユーザごとの現在の推し set | 投票時に per-user で DELETE + INSERT |
| `DailyOshiCount`（新設） | 過去日の pair 集計 snapshot | 夜間 cron（00:01 JST）が Votes から as-of 集計 |

**read パス**：

| 表示 | データ源 |
|---|---|
| プロフィール（自分の投票） | `LatestVotes` SELECT |
| 今日の pair ランキング | `LatestVotes` self-join で集計 |
| 過去 29 日の pair ランキング | `DailyOshiCount` SELECT |
| 将来の higher-order 分析（今日） | `LatestVotes` を多段 self-join |
| 将来の higher-order 分析（過去） | `Votes` ad-hoc 集計（slow OK） |

## なぜこの設計か

| 判断 | 理由 |
|---|---|
| 履歴と現在状態を別テーブル | read 中心。現在状態を毎 read で計算するのは無駄 |
| `LatestVotes` を per-user で持つ（pair 集計形にしない） | 将来 triple や n-tuple 分析を入れたくなった時、スキーマ変更なしで対応可 |
| `DailyOshiCount` は過去日のみ | 今日分は `LatestVotes` 集計で代替。書き込み負荷を最小化 |
| `voted_time TIMESTAMP` → `voted_date DATE` | 同日内の精度は不要。`mode: 'string'` で TZ 解釈をアプリ層で明示化 |
| `UserStates` も同様に `recorded_date DATE` | 全テーブルで日付列の扱いを統一 |
| Votes の追加 index は不要 | 既存 PK `(twitter_id, voted_date, character_name)` が必要なクエリ全てをカバー |
| `GET_LOCK` 不要 | per-user 書き込みは行ロックで自然に直列化される |
| Redis 不採用 | `LatestVotes` が小さく、MySQL 集計で十分速い。後から追加可能 |
| In-process cron（node-cron）採用 | サーバーレス縛りなし。手動 endpoint も併設 |
| `mode: 'string'` + luxon | TZ env 依存を排除。`'YYYY-MM-DD'` string で driver 解釈介在ゼロ |
| **キーは `twitter_id` を維持** | better-auth で実 `user` テーブル（安定 `id`）が増えたが、`Votes`/`UserStates` の貼り替えは移行コスト・既存データ紐付けが重い。`user.twitterId` は unique なので twitter_id 維持で整合する。user.id への移行は将来の独立タスク |

## コードとの対応関係（実装後）

- `server-ts/src/db/schema.ts`：`votes`（`voted_date DATE`）、`userStates`（`recorded_date DATE`）、
  新設 `latestVotes`・`dailyOshiCount`。better-auth の `user`/`session`/`account`/`verification` も同居（本改修では非対象）
- `server-ts/src/lib/votes.ts`：`getLatestVotes`（LatestVotes 直引き）、`getCurrentVotesRelatedToOshi`（LatestVotes self-join・新設）、
  `getVotesRelatedToOshi`（Votes as-of・maxDate 付き、テスト/将来の過去分析用に残置）、
  `getLatestVotesForAnalysis` / `getLatestVotesForAnalysisAll`、`getTimelineData`、`insertVotesIfUpdated`
- `server-ts/src/lib/users.ts`：`getLatestUserState`、`insertUserStatesIfUpdated`（upsert）、`getUserStatesMaster`
- `server-ts/src/lib/aggregate.ts`（新設）：`aggregateOshiCountForDate(database, date)`、`aggregateYesterday(date?)`
- `server-ts/src/app.ts`：Hono ルート。`votes`/`users` は `/votes/:id`・`/users/:id` で twitter_id を `:id` として受ける。
  `POST /admin/aggregate-day` を追加。`*` ミドルウェアが `API_KEY` で全 API を保護（`/api/auth/*` のみ除外）
- `server-ts/src/index.ts`：`serve()` + node-cron スケジュール（00:01 JST）
- `server-ts/addTestData.ts`：ローカル seed（votes/latestVotes/userStates + DailyOshiCount を固定日 backfill）
- `server-ts/backfillDailyOshiCount.ts`（新設）：DailyOshiCount 過去日 backfill（`pnpm db:backfill`）
- `server-ts/migrations/001_vote_aggregation_redesign.sql`（新設）：本番マイグレーション
- テスト：`server-ts/vitest.config.ts`・`server-ts/test/globalSetup.ts`・`server-ts/src/lib/{votes,users}.test.ts`

投票フロー（next 側）：`next/src/actions/voteActions.ts` が `getSession()` で
`session.user.twitterId`（better-auth、nullable）を取得 → null チェック済み → `twitterID` として API に渡す。
**書き込み関数のシグネチャ（`twitterID` を受ける）は変更不要だった。API レスポンス型も不変のため next 側の改修なし。**

## スキーマ定義（Drizzle、`server-ts/src/db/schema.ts`）

> 注：現状の drizzle は `1.0.0-rc.3`（元計画時は `1.0.0-beta.10`）。
> `date` / `mode: 'string'` / `index` / `primaryKey` のシグネチャは rc.3 でも同一。

### Votes（既存、修正）

```ts
export const votes = mysqlTable(
  'Votes',
  {
    twitterID:
      varchar('twitter_id', { length: 32 }).notNull(),
    votedDate:
      date('voted_date', { mode: 'string' }).notNull(),
    characterName:
      varchar('character_name', { length: 20 }).notNull()
        .references(() => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }),
    level:
      tinyint('level', { unsigned: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [
      table.twitterID, table.votedDate, table.characterName,
    ]}),
  ],
);
```

### LatestVotes（新設）

```ts
export const latestVotes = mysqlTable(
  'LatestVotes',
  {
    twitterID:
      varchar('twitter_id', { length: 32 }).notNull(),
    votedDate:
      date('voted_date', { mode: 'string' }).notNull(),
    characterName:
      varchar('character_name', { length: 20 }).notNull()
        .references(() => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }),
    level:
      tinyint('level', { unsigned: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.twitterID, table.characterName] }),
    index('idx_character_name').on(table.characterName),
  ],
);
```

### DailyOshiCount（新設）

```ts
export const dailyOshiCount = mysqlTable(
  'DailyOshiCount',
  {
    snapshotDate:
      date('snapshot_date', { mode: 'string' }).notNull(),
    oshi:
      varchar('oshi', { length: 20 }).notNull()
        .references(() => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }),
    relatedChara:
      varchar('related_chara', { length: 20 }).notNull()
        .references(() => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }),
    count:
      int('count', { unsigned: true }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.snapshotDate, table.oshi, table.relatedChara]
    }),
    index('idx_oshi_date').on(table.oshi, table.snapshotDate),
  ],
);
```

### UserStates（既存、修正）

```ts
export const userStates = mysqlTable(
  'UserStates',
  {
    twitterID:
      varchar('twitter_id', { length: 20 }).notNull(),
    recordedDate:
      date('recorded_date', { mode: 'string' }).notNull(),
    series:
      tinyint('series', { unsigned: true }).notNull(),
    status:
      varchar('status', { length: 20 }).notNull()
        .references(() => userStatesMaster.state,
          { onUpdate: 'cascade', onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [
      table.twitterID, table.recordedDate, table.series,
    ]}),
  ],
);
```

> `int` を新たに import する必要がある（`drizzle-orm/mysql-core`）。`date` も同様。

## 書き込みフロー（投票時）

```ts
import { DateTime } from 'luxon';

export const insertVotesIfUpdated = async ({ twitterID, data }) => {
  const previousLatest = await getLatestVotes(twitterID);
  if (isSameSet(previousLatest, data)) {
    return { updatedCharaNames: [] };
  }

  const today = DateTime.now().setZone('Asia/Tokyo').toISODate();

  await db.transaction(async (tx) => {
    // Votes: 今日分を置き換え（同日再投票対応）
    await tx.delete(votes).where(and(
      eq(votes.twitterID, twitterID),
      eq(votes.votedDate, today),
    ));
    await tx.insert(votes).values(
      data.map(d => ({ ...d, twitterID, votedDate: today }))
    );

    // LatestVotes: そのユーザ分を置き換え
    await tx.delete(latestVotes)
      .where(eq(latestVotes.twitterID, twitterID));
    await tx.insert(latestVotes).values(
      data.map(d => ({
        twitterID,
        characterName: d.characterName,
        level: d.level,
        votedDate: today,
      }))
    );
  });

  // invalidate 用キャラ名
  const removed = previousLatest
    .filter(p => !data.some(d => d.characterName === p.characterName))
    .map(p => p.characterName);
  return {
    updatedCharaNames: [...data.map(d => d.characterName), ...removed],
  };
};
```

**並行性**：MySQL InnoDB の gap lock + 行ロックで自然に直列化。`GET_LOCK` 不要。

> 実装では `isSameSet` ヘルパは切り出さず、変更判定を関数内にインライン展開している
> （`previousLatest.length === data.length && data.every(d => previousLatest.some(lv => lv.characterName === d.characterName && lv.level === d.level))`）。
> 変更が無ければ何も書かずに `{ updatedCharaNames: [] }` を返す。`votedDate` は `DateTime.now().setZone('Asia/Tokyo').toISODate()!`。

## getLatestVotes の書き換え

```ts
export const getLatestVotes = async (twitterID: string) => {
  return await db
    .select({
      characterName: latestVotes.characterName,
      level: latestVotes.level,
    })
    .from(latestVotes)
    // level 同値時を公式順で安定させるため characters を join
    .innerJoin(characters, eq(latestVotes.characterName, characters.name))
    .where(eq(latestVotes.twitterID, twitterID))
    .orderBy(asc(latestVotes.level), asc(characters.series), asc(characters.sort));
};
```

MAX サブクエリ消滅。`getLatestUserState`（users.ts）は `recorded_date` ベースに書き換え、
**`recorded_date` の MAX 取得を維持**した（LatestVotes 相当の現在状態テーブルは作らない。
更新頻度が低く MAX 取得で十分軽いため。`LatestUserStates` 導入は設計外）。

## 今日の pair 集計（read 時に LatestVotes から）

特定 oshi に共起するキャラを LatestVotes の self-join で数える `getCurrentVotesRelatedToOshi` を新設し、
`getLatestVotesForAnalysis` / `getLatestVotesForAnalysisAll` をこれに切り替えた。全 Votes 走査 + MAX サブクエリは消滅。

```ts
export const getCurrentVotesRelatedToOshi = async (oshi: string) => {
  const l1 = alias(latestVotes, 'l1');
  const l2 = alias(latestVotes, 'l2');
  return await db
    .select({ characterName: l1.characterName, count: count(l1.characterName) })
    .from(l1)
    .innerJoin(l2, eq(l1.twitterID, l2.twitterID))
    // count 同値時を公式順で安定させるため characters を join
    .innerJoin(characters, eq(l1.characterName, characters.name))
    .where(and(eq(l2.characterName, oshi), ne(l1.characterName, oshi)))
    .groupBy(l1.characterName, characters.series, characters.sort)
    .orderBy(desc(count(l1.characterName)), asc(characters.series), asc(characters.sort));
};
```

> 同値時の副次キーは公式順 `(characters.series, characters.sort)`。`ONLY_FULL_GROUP_BY` を満たすため
> 並べ替えに使う `series`/`sort` も `GROUP BY` に含める（`character_name` と一意対応なので group 数は増えない）。
> `getVotesRelatedToOshi`（Votes ベース・`maxDate` 付き）も同じく公式順 join に揃えてある。

## UserStates の書き込み（upsert）

`UserStates` は date 化で PK が `(twitter_id, recorded_date, series)` になり、同日に状態を再更新すると
PK 衝突する。**series 1-4 の固定集合で行が増減しない**ため、Votes のような DELETE+INSERT ではなく
`INSERT ... ON DUPLICATE KEY UPDATE`（status のみ更新）で吸収する。

```ts
await db.insert(userStates)
  .values([
    { twitterID, recordedDate, series: 1, status: gs1State },
    { twitterID, recordedDate, series: 2, status: gs2State },
    { twitterID, recordedDate, series: 3, status: gs3State },
    { twitterID, recordedDate, series: 4, status: gs4State },
  ])
  .onDuplicateKeyUpdate({ set: { status: sql`values(${userStates.status})` } });
```

## 夜間 cron / 集計（DailyOshiCount 生成）

集計は **Votes から「対象日終了時点の各ユーザ最新 set」を復元して数える**方式に統一した
（当初案の「LatestVotes を `voted_date <= targetDate` で絞る」案は、過去日の backfill には使えないため不採用）。
これにより **cron も backfill も同一関数 `aggregateOshiCountForDate` を再利用**でき、
任意の過去日を正確に再計算できる（リカバリ・catch-up に強い）。

```ts
// server-ts/src/lib/aggregate.ts
import type { MySql2Database } from 'drizzle-orm/mysql2'
import { sql, eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { db } from '../db'
import { dailyOshiCount } from '../db/schema'

// targetDate 終了時点の pair 集計を DailyOshiCount に書き込む。
// executor を引数に取り、本番（src/db の db）と seed スクリプト（独自接続）の双方から使える。
export const aggregateOshiCountForDate = async (
  database: MySql2Database<any>,
  targetDate: string,
) => {
  await database.transaction(async (tx) => {
    await tx.delete(dailyOshiCount).where(eq(dailyOshiCount.snapshotDate, targetDate))
    await tx.execute(sql`
      INSERT INTO DailyOshiCount (snapshot_date, oshi, related_chara, count)
      WITH latest_per_user AS (
        SELECT v.twitter_id, v.character_name
        FROM Votes v
        WHERE v.voted_date = (
          SELECT MAX(v2.voted_date) FROM Votes v2
          WHERE v2.twitter_id = v.twitter_id AND v2.voted_date <= ${targetDate}
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

// 「昨日」（JST）を集計（cron 用）。date を渡せば任意日のリカバリにも使える。
export const aggregateYesterday = async (date?: string) => {
  const targetDate = date
    ?? DateTime.now().setZone('Asia/Tokyo').minus({ days: 1 }).toISODate()!
  await aggregateOshiCountForDate(db, targetDate)
  return targetDate
}
```

cron スケジュールは `server-ts/src/index.ts`（`serve()` の隣）に追加：

```ts
// index.ts
import cron from 'node-cron'
cron.schedule(
  '1 0 * * *',
  async () => {
    try {
      const date = await aggregateYesterday()
      console.log(`DailyOshiCount aggregated for ${date}`)
    } catch (e) {
      console.error('aggregate cron failed:', e)
    }
  },
  { timezone: 'Asia/Tokyo', noOverlap: true },
)
```

**as-of 集計の意味**：`MAX(voted_date) <= targetDate` で各ユーザの「その日終了時点の最新投票日」を取り、
その set を self-join して pair を数える。投票が何日も無いユーザも「最後の投票」が反映されるため、
**日付の歯抜けが起きない**。`noOverlap` で前回実行が長引いても多重起動しない。
DailyOshiCount は過去日のみ（今日分は `getCurrentVotesRelatedToOshi` で別途集計）。

## 手動実行用 endpoint（リカバリ・backfill 両用）

`app.ts` の route チェーンに追加。既存の `*` ミドルウェアが `API_KEY` で保護するため、
独自 `CRON_API_KEY` は不要（元計画から変更）。`date` クエリは `YYYY-MM-DD` を zValidator で検証。

```ts
.post(
  '/admin/aggregate-day',
  zValidator('query', z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })),
  async c => {
    const { date } = c.req.valid('query')   // 省略時は昨日
    try {
      const snapshotDate = await aggregateYesterday(date)
      return c.json({ ok: true, snapshotDate }, 200)
    } catch (e) {
      console.error(`exception at POST /admin/aggregate-day: ${e instanceof Error ? e.message : ''}`)
      return c.body(null, 500)
    }
  },
)
```

## 本番マイグレーション SQL

> 対象テーブルは `Votes` / `UserStates` と新規 2 テーブルのみ。
> better-auth の認証テーブル（`user`/`session`/`account`/`verification`）には触れない。
> 本番 DB はテーブル単位権限なので、新テーブルには別途 GRANT が必要（後述）。

### Phase 1: Votes + UserStates の date 化（同一トランザクション）

```sql
BEGIN;

-- Votes
ALTER TABLE Votes ADD COLUMN voted_date DATE NULL AFTER voted_time;
UPDATE Votes SET voted_date = DATE(CONVERT_TZ(voted_time, '+00:00', '+09:00'));
DELETE v1 FROM Votes v1
JOIN Votes v2
  ON v1.twitter_id = v2.twitter_id
 AND v1.voted_date = v2.voted_date
 AND v1.character_name = v2.character_name
 AND v1.voted_time < v2.voted_time;
ALTER TABLE Votes
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (twitter_id, voted_date, character_name),
  MODIFY voted_date DATE NOT NULL,
  DROP COLUMN voted_time;

-- UserStates
ALTER TABLE UserStates ADD COLUMN recorded_date DATE NULL;
UPDATE UserStates SET recorded_date = DATE(CONVERT_TZ(recorded_time, '+00:00', '+09:00'));
DELETE u1 FROM UserStates u1
JOIN UserStates u2
  ON u1.twitter_id = u2.twitter_id
 AND u1.recorded_date = u2.recorded_date
 AND u1.series = u2.series
 AND u1.recorded_time < u2.recorded_time;
ALTER TABLE UserStates
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (twitter_id, recorded_date, series),
  MODIFY recorded_date DATE NOT NULL,
  DROP COLUMN recorded_time;

COMMIT;
```

### Phase 2: 新テーブル作成 + LatestVotes populate

```sql
BEGIN;

CREATE TABLE LatestVotes (
  twitter_id     VARCHAR(32) NOT NULL,
  voted_date     DATE        NOT NULL,
  character_name VARCHAR(20) NOT NULL,
  level          TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (twitter_id, character_name),
  KEY idx_character_name (character_name),
  FOREIGN KEY (character_name) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

INSERT INTO LatestVotes (twitter_id, voted_date, character_name, level)
SELECT v.twitter_id, v.voted_date, v.character_name, v.level
FROM Votes v
WHERE v.voted_date = (
  SELECT MAX(v2.voted_date) FROM Votes v2 WHERE v2.twitter_id = v.twitter_id
);

CREATE TABLE DailyOshiCount (
  snapshot_date   DATE        NOT NULL,
  oshi            VARCHAR(20) NOT NULL,
  related_chara   VARCHAR(20) NOT NULL,
  count           INT UNSIGNED NOT NULL,
  PRIMARY KEY (snapshot_date, oshi, related_chara),
  KEY idx_oshi_date (oshi, snapshot_date),
  FOREIGN KEY (oshi) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (related_chara) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMIT;
```

### Phase 2.5: 本番アプリ DB ユーザへの GRANT（忘れ厳禁）

本番 DB はテーブル単位の権限付与。新テーブルへのアクセス権を明示的に与えないと
アプリから errno 1142 になる（ローカルでは再現しない）。

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON <db>.LatestVotes    TO '<app_user>'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON <db>.DailyOshiCount TO '<app_user>'@'%';
FLUSH PRIVILEGES;
```

### Phase 3: DailyOshiCount backfill（既定 30 日分）

`server-ts/backfillDailyOshiCount.ts`。as-of 集計ロジックは cron と同じ `aggregateOshiCountForDate` を再利用し、
直近 N 日（既定 30、引数で変更可。今日は含めない）をループで生成する。

```ts
import { DateTime } from 'luxon'
import { db, client } from './src/db'
import { aggregateOshiCountForDate } from './src/lib/aggregate'

const ndays = Number(process.argv[2] ?? 30)
const today = DateTime.now().setZone('Asia/Tokyo')
try {
  for (let i = ndays; i >= 1; i--) {
    const targetDate = today.minus({ days: i }).toISODate()!
    console.log(`backfilling ${targetDate} ...`)
    await aggregateOshiCountForDate(db, targetDate)
  }
} finally {
  await client.end()
}
```

実行：`pnpm db:backfill`（= `pnpm tsx backfillDailyOshiCount.ts`）。日数指定は `pnpm db:backfill 60` など。

## 本番デプロイ手順

1. **事前**：本番データを取得してローカルでドライラン、各 SQL の所要時間を計測
2. **メンテ枠開始**：日次バックアップ直後（バックアップで前夜分まで保証されるため、ロールバック時の損失最小化）
3. **追加バックアップ**：マイグレーション直前に DB ダンプを取得
4. **アプリ停止**（コンテナ停止 or reverse proxy で maintenance page）
5. **Phase 1 SQL 実行**（Votes + UserStates の date 化）
6. **Phase 2 SQL 実行**（新テーブル作成 + LatestVotes populate）
7. **Phase 2.5 GRANT 実行**（新テーブルへのアプリユーザ権限付与）
8. **Phase 3 スクリプト実行**（DailyOshiCount backfill：`pnpm db:backfill`、既定 30 日）
9. **新コードをデプロイ**（コンテナ再ビルド・再起動、cron 含む。本番 amd64 ビルドは GH Actions で）
10. **動作確認**：
    - トップページ表示
    - キャラ個別ページ（現在ランキング + 30 日グラフ）
    - プロフィール（自分の投票履歴）
    - 投票実行 → LatestVotes 更新確認
11. **メンテモード解除**
12. **翌日朝**：cron が動いて DailyOshiCount[昨日] が生成されたか確認

想定所要時間：10〜30 分（実測でブラッシュアップ）

## ロールバック計画

- **マイグレーション失敗**：アプリ停止状態のまま、DB ダンプから復元
- **デプロイ後に不具合**：新コードは新スキーマ前提なので、現実的には DB 復元（その間の投票は失われる）
- 動作確認をしっかり通してからメンテモード解除することで、ロールバック発動のリスクを最小化

## テスト戦略

リファクタリング前に**現状ロジックの snapshot test を追加**して、変更後の挙動変化を機械的に検出する。

### フレームワーク・実行環境

**vitest `^4.1.7`** を採用（`minimumReleaseAge: 4320` の対象）。
dev DB を汚さないよう、テストは専用 DB `<MYSQL_DATABASE>_test` に対して走らせる：

- `server-ts/test/globalSetup.ts`：root で `<db>_test` を **DROP→CREATE→GRANT** し、
  `drizzle-kit push`（schema 反映）＋ `addTestData`（seed）を流す。teardown で DROP。毎回まっさら。
- `server-ts/vitest.config.ts`：`test.env.MYSQL_DATABASE` をテスト DB に差し替え、`fileParallelism: false`。
- 実行は seed と同様コンテナ内：`docker compose exec server pnpm test`（root の `pnpm test` でラップ）。
- 生成 snapshot はコンテナ内に出るため、初回は `docker compose cp` でホストへ取り出してコミット。

### テスト対象

- `server-ts/src/lib/votes.ts`：`getLatestVotes`、`getVotesRelatedToOshi`、`getCurrentVotesRelatedToOshi`（経由）、`getLatestVotesForAnalysis`、`getLatestVotesForAnalysisAll`、`getTimelineData`
- `server-ts/src/lib/users.ts`：`getLatestUserState`、`getUserStatesMaster`、`insertUserStatesIfUpdated`（同日再更新の回帰テスト）

### アプローチ（実装済み）

1. **時刻固定**：`vi.useFakeTimers()` + `vi.setSystemTime('2024-01-05T12:00:00+09:00')` で `getTimelineData` を決定的に
2. **DB seed 固定**：`addTestData.ts` は固定日付・固定 ID。`TEST_TWITTER_ID` は globalSetup で `testID2` に上書きして決定化
3. **`toMatchSnapshot()`** で出力を凍結（baseline 12 件）。date 化・LatestVotes/DailyOshiCount 切替の各段階で **snapshot 不変＝挙動保存**を確認
4. **同値時の順序ブレ対策（両方実施）**：本番 API はクエリ側で公式順 `ORDER BY ... characters.series, characters.sort` を付与し、
   テスト側でも `.sort()` 正規化して環境差に強くする
5. **書き込みの回帰テスト**：`insertUserStatesIfUpdated` の同日 2 回更新が PK 衝突せず置き換わることを確認
   （専用 twitterID + `afterAll` 後始末で snapshot 群を汚さない）

## 実装着手リスト

順番に消化していく：

- [x] **1.** vitest を server-ts に導入、`pnpm test` で実行できるよう設定
- [x] **2.** addTestData.ts の決定性確認（`TEST_TWITTER_ID` 固定で対応）
- [x] **3.** 現状ロジックに対する snapshot test を作成・コミット（votes.ts, users.ts）
- [x] **4.** schema.ts に LatestVotes / DailyOshiCount 追加、Votes / UserStates を date 化
- [x] **5.** `getLatestVotes` を LatestVotes ベースに書き換え
- [x] **6.** `getLatestUserState` を新スキーマ（recorded_date）に合わせて書き換え（MAX 維持。LatestUserStates は設計外）
- [x] **7.** `insertVotesIfUpdated` の書き込みフロー実装（Votes + LatestVotes 1 トランザクション）
- [x] **8.** `insertUserStatesIfUpdated` の書き込みフロー実装（recorded_date 付与 + 当日分の DELETE+INSERT。date 化で生じる同日再更新の PK 衝突を回避。回帰テスト有り）
- [x] **9.** `getCurrentVotesRelatedToOshi` 新設、`getLatestVotesForAnalysis` / `All` を LatestVotes 集計へ（API レスポンス型不変のため Next.js 側変更なし）
- [x] **10.** `getTimelineData` を DailyOshiCount + 今日分 LatestVotes 集計に書き換え
- [x] **11.** `aggregateOshiCountForDate` / `aggregateYesterday`（aggregate.ts）+ node-cron スケジュール（index.ts）+ 手動 endpoint（app.ts）実装
- [x] **12.** snapshot test 再実行・diff レビュー（baseline 12件すべて不変＝挙動保存を確認）
- [x] **13.** 本番マイグレーション SQL スクリプト作成（`server-ts/migrations/001_vote_aggregation_redesign.sql`、Phase 1/2/2.5）
- [x] **14.** DailyOshiCount backfill スクリプト作成（`server-ts/backfillDailyOshiCount.ts`、`pnpm db:backfill`）
- [ ] **15.** ローカルで本番データドライラン、所要時間計測
- [ ] **16.** 本番マイグレーション枠を決めて告知
- [ ] **17.** 本番デプロイ実行
- [ ] **18.** 動作確認 + メンテ解除
- [ ] **19.** 翌日 cron 動作確認

> 補足（実装で確定した設計判断）：
> - `insertUserStatesIfUpdated` は同日再更新の回帰テストを追加済み（専用 ID + 後始末で snapshot 非汚染）。
>   `insertVotesIfUpdated` の write テストは、globalSetup が seed を 1 回だけ流す都合で他テスト（特に
>   `getLatestVotesForAnalysisAll`）への DB 汚染リスクがあるため未追加 → ローカル実機（Playwright + 手動ログイン）で
>   Votes 追記 + LatestVotes 置換を確認済み。トランザクション rollback で分離した write テスト追加は follow-up。
> - 集計は LatestVotes ではなく **Votes の「as-of date 最新 set」** から計算する方式に統一
>   （cron も backfill も同じ `aggregateOshiCountForDate` を再利用でき、歯抜け・catch-up に強い）。
> - 同値時ソートは **公式順 `(characters.series, characters.sort)`**（ランキング・timeline 凡例とも）。
> - `UserStates` の同日再更新は **upsert（`ON DUPLICATE KEY UPDATE`）**。Votes は推し増減があるので DELETE+INSERT。

## 用語・前提

- **TZ**：すべて `Asia/Tokyo`。docker-compose の env、`node-cron` の timezone オプション、luxon の `setZone` で明示
- **日付の文字列表現**：`'YYYY-MM-DD'`、ISO 8601 date 形式。`DateTime.fromISO()` / `.toISODate()` で相互変換
- **「今日」の定義**：`DateTime.now().setZone('Asia/Tokyo').toISODate()`
- **「昨日」の定義**：同上 `.minus({ days: 1 }).toISODate()`
- **DB driver**：mysql2 `^3.22.3`、Drizzle ORM `1.0.0-rc.3`、drizzle-kit `1.0.0-rc.3`
- **luxon**：catalog `^3.7.2`
- **node-cron**：`^4.2.1`（型同梱のため `@types/node-cron` は不使用）
- **vitest**：`^4.1.7`
- **MySQL バージョン**：8.4

## 設計外（次回以降）

このブランチでは扱わない、後続の検討事項：

- `Votes`/`UserStates` のキーを `twitter_id` から `user.id`（better-auth）へ貼り替える移行
- higher-order 分析機能（triple 集計など）の追加
- `UserStates` に対する `LatestUserStates` 相当テーブルの導入（更新頻度次第）

## 元計画からの差分（改訂サマリ）

| 項目 | 元計画（2026-05-16） | 本改訂（2026-05-24） |
|---|---|---|
| 認証スタック | 「next-auth → ? 方針未定」を設計外扱い | **better-auth に確定済み**（不確定要素が解消）。`twitterId` は `session.user.twitterId` 経由 |
| 投票キー | twitter_id | twitter_id 維持（決定。user.id 移行は設計外へ） |
| drizzle | `1.0.0-beta.10-4a43a22` | `1.0.0-rc.3`（API シグネチャは同一想定） |
| 手動 endpoint 認証 | 独自 `CRON_API_KEY` Bearer チェック | 不要。既存 `API_KEY` ミドルウェアが `/admin/*` も保護 |
| 新テーブル GRANT | 言及なし | Phase 2.5 として明記（本番はテーブル単位権限、errno 1142 対策） |
| node-cron/vitest | 追加予定 | node-cron `^4.2.1`（型同梱）/ vitest `^4.1.7` 導入済み |
| DailyOshiCount 集計源 | LatestVotes を `voted_date <= targetDate` で絞る | **Votes の as-of date 最新 set**（cron/backfill 共用、過去日も正確に再計算可） |
| UserStates 同日再更新 | （未考慮） | **upsert（`ON DUPLICATE KEY UPDATE`）**で吸収（date 化で生じる PK 衝突対策） |
| 同値時ソート | `character_name`（or テスト正規化） | **公式順 `(characters.series, characters.sort)`**（本番 API・凡例とも安定化） |
| ドキュメント置き場 | リポジトリ root `TASKS.md` | `docs/`（個人タスクログは `.claude/local/TASKS.md` に分離済みのため棲み分け） |
