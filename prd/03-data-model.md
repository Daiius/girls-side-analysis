# 03. データモデル

本章は DB スキーマ（MySQL 8.4 / Drizzle）を定める。**本章がスキーマの原典**であり、
実装 [`server-ts/src/db/schema.ts`](../server-ts/src/db/schema.ts) は本章に従う（食い違えば本章が正しい）。
ドメイン定義は [01](./01-domain.md)、書き込み規則は [04](./04-voting.md)、集計は [05](./05-analysis.md) を参照。

---

## 1. テーブル一覧

| テーブル | 役割 | 書き込み主体 |
|---|---|---|
| `Characters` | キャラクターマスタ（61 件）。公式順 `(series, sort)` の定義元 | seed / マイグレーションのみ |
| `Votes` | **投票履歴の不変ログ**（日単位） | 投票時（当日分を置換） |
| `LatestVotes` | **ユーザーごとの現在の推し set** | 投票時（per-user で全置換） |
| `DailyOshiCount` | **過去日の pair 集計 snapshot** | 夜間 cron / 手動 backfill |
| `UserStatesMaster` | プレイ状態の選択肢マスタ（3 件） | seed |
| `UserStates` | ユーザー × シリーズ × 日 のプレイ状態 | 投票時（upsert） |
| `user` / `session` / `account` / `verification` | better-auth 管理の認証テーブル | better-auth |

## 2. 3 テーブル設計（Votes / LatestVotes / DailyOshiCount）

このアプリは **read >> write**（閲覧は常時、投票は稀）である。にもかかわらず旧実装は
「毎 read で `Votes` 全体を走査して各ユーザーの最新投票を計算し直す」構造で、トップページは
**全 61 キャラ × その重いクエリ**、キャラページは **30 日分 × 同クエリ**を走らせていた。

これを役割分担で解いたのが現行の 3 テーブル構成である（経緯: [`docs/vote-aggregation-redesign.md`](../docs/vote-aggregation-redesign.md)）。

| 判断 | 理由 |
|---|---|
| 履歴（`Votes`）と現在状態（`LatestVotes`）を分ける | 現在状態を毎 read で計算するのが無駄。write 時に 1 回書けばよい |
| `LatestVotes` は **pair 形にせず per-user の推し set** で持つ | 将来 triple / n-tuple 分析を入れてもスキーマ変更が要らない |
| `DailyOshiCount` は**過去日のみ**（今日を含めない） | 今日分は `LatestVotes` の self-join で十分軽い。書き込み負荷を最小化 |
| 集計元は `LatestVotes` ではなく **`Votes` の as-of 参照** | 過去日の backfill・再計算を同じ関数でできる（[05](./05-analysis.md) §2） |
| Redis 等のキャッシュ層を持たない | `LatestVotes` は小さく、MySQL の集計で足りる。後から追加できる |
| `GET_LOCK` を使わない | 書き込みは per-user の DELETE+INSERT。InnoDB の行ロックで自然に直列化される |

**read パスの対応表**:

| 表示 | データ源 |
|---|---|
| 自分の投票（プロフィール） | `LatestVotes` を直引き |
| 今日の pair 集計 | `LatestVotes` の self-join |
| 過去 29 日の pair 集計 | `DailyOshiCount` を SELECT |
| 将来の higher-order 分析（今日） | `LatestVotes` を多段 self-join |
| 将来の higher-order 分析（過去） | `Votes` の ad-hoc 集計（遅くてよい） |

## 3. テーブル定義

### 3.1 `Characters`

| カラム | 型 | 備考 |
|---|---|---|
| `series` | tinyint unsigned NOT NULL | 1〜4 |
| `sort` | tinyint unsigned NOT NULL | シリーズ内の公式順 |
| `name` | varchar(20) NOT NULL UNIQUE | **ドメイン識別子**。他テーブルの FK 参照先 |
| `reading` | varchar(40) NOT NULL DEFAULT `''` | ひらがな読み（検索用）。既存 DB への後付けのため default 付き |

- PK: `(series, sort)`。`name` は UNIQUE（FK 参照先として必要）。
- 全テーブルの FK は `ON UPDATE CASCADE, ON DELETE RESTRICT`。**キャラの改名には追随し、削除は拒否する**。

### 3.2 `Votes`（投票履歴の不変ログ）

| カラム | 型 | 備考 |
|---|---|---|
| `twitter_id` | varchar(32) NOT NULL | X のユーザー ID（`user.twitter_id`。[06](./06-auth-and-privacy.md) §2） |
| `voted_date` | date NOT NULL | JST の `'YYYY-MM-DD'`（§4） |
| `character_name` | varchar(20) NOT NULL → `Characters.name` | |
| `level` | tinyint unsigned NOT NULL | 順位（0 始まり。[01](./01-domain.md) §2.1） |

- PK: `(twitter_id, voted_date, character_name)` — **「1 ユーザー・1 日・1 キャラ」に 1 行**。
- 追加インデックスは持たない。PK が必要なクエリをすべてカバーする。
- 同日の再投票は当日分を DELETE してから INSERT する（[04](./04-voting.md) §2）。

### 3.3 `LatestVotes`（現在の推し set）

| カラム | 型 | 備考 |
|---|---|---|
| `twitter_id` | varchar(32) NOT NULL | |
| `voted_date` | date NOT NULL | この set が確定した日 |
| `character_name` | varchar(20) NOT NULL → `Characters.name` | |
| `level` | tinyint unsigned NOT NULL | |

- PK: `(twitter_id, character_name)` / index: `idx_character_name(character_name)`。
- **`Votes` の派生であり、真実は `Votes` にある**。壊れた場合は各ユーザーの `MAX(voted_date)` の行から再構築できる。

### 3.4 `DailyOshiCount`（過去日の pair 集計）

| カラム | 型 | 備考 |
|---|---|---|
| `snapshot_date` | date NOT NULL | **その日の終了時点**の集計 |
| `oshi` | varchar(20) NOT NULL → `Characters.name` | |
| `related_chara` | varchar(20) NOT NULL → `Characters.name` | `oshi` と異なる |
| `count` | int unsigned NOT NULL | 「`oshi` を推す人のうち `related_chara` も推す人数」 |

- PK: `(snapshot_date, oshi, related_chara)` / index: `idx_oshi_date(oshi, snapshot_date)`。
- **今日の行は存在しない**（read 時に `LatestVotes` から計算する）。
- 同一日の再集計は **その日の行を DELETE してから INSERT**（冪等）。

### 3.5 `UserStatesMaster` / `UserStates`

`UserStatesMaster`: `state` varchar(20) PK / `sort` tinyint unsigned NOT NULL（値は [01](./01-domain.md) §4）。

`UserStates`:

| カラム | 型 | 備考 |
|---|---|---|
| `twitter_id` | **varchar(20)** NOT NULL | ⚠️ 他テーブルは varchar(32)。歴史的な不揃い（§6） |
| `recorded_date` | date NOT NULL | JST |
| `series` | tinyint unsigned NOT NULL | 1〜4 |
| `status` | varchar(20) NOT NULL → `UserStatesMaster.state` | |

- PK: `(twitter_id, recorded_date, series)`。
- 行の集合が **series 1〜4 で固定**なので、同日再更新は DELETE+INSERT ではなく
  `INSERT ... ON DUPLICATE KEY UPDATE`（status のみ）で吸収する（[04](./04-voting.md) §3）。
- 「現在の状態」テーブル（`LatestUserStates` 相当）は**作らない**。更新頻度が低く `MAX(recorded_date)` で十分軽い。

### 3.6 認証テーブル（better-auth）

`user` / `session` / `account` / `verification`。`@better-auth/cli` 生成の雛形を `schema.ts` に同居させている。

- `user.twitter_id` varchar(32) UNIQUE — **better-auth の `additionalFields` で足した独自カラム**。
  `account` 作成後フックで、`providerId === 'twitter'` の `accountId` を書き戻す。
- `user.email` は NOT NULL UNIQUE。X から email が取れない場合は `${username ?? id}@twitter.local` を充てる。
- 詳細は [06](./06-auth-and-privacy.md)。

## 4. 日付とタイムゾーン

- 日付列はすべて **`DATE` 型 + Drizzle `mode: 'string'`**。アプリは `'YYYY-MM-DD'` 文字列としてのみ扱う。
  `TIMESTAMP` を避けるのは、**ドライバとプロセスの TZ 解釈を設計から排除する**ため。
- 「今日」「昨日」「30 日窓の境界」はすべて **luxon で `setZone('Asia/Tokyo')` を明示**して求める。
- 旧スキーマは `voted_time TIMESTAMP` / `recorded_time TIMESTAMP`（UTC）だった。
  `DATE`(JST) への移行は `CONVERT_TZ` で行い、同日重複は最新の 1 行を残して削除した
  （[`server-ts/migrations/001_vote_aggregation_redesign.sql`](../server-ts/migrations/001_vote_aggregation_redesign.sql)）。

## 5. マイグレーション運用

| 用途 | コマンド | 対象 |
|---|---|---|
| dev / CI の使い捨て DB | `pnpm db:push`（`drizzle-kit push --force`） | 履歴を残さず強制同期 |
| **本番** | `pnpm db:generate` で生成 → **イメージ同梱の `migrate.js`** を使い捨てコンテナで実行（[02](./02-architecture.md) §6.3） | `server-ts/drizzle/*` にバージョン管理 |
| 既存 DB を初めて管理下に載せる | `pnpm db:baseline <世代名>`（**一度だけ**） | **指定した世代まで**を「適用済み」として記録（SQL は実行しない） |

- `db:baseline` を忘れて `db:migrate` を打つと、ベースラインの `CREATE TABLE` が既存テーブルと衝突する。**新規 DB では baseline 不要**。
- ⚠️ **`db:baseline` は「どこまで記録するか」の既定を持たない。必ず引数で指定する。**
  既存 DB がどの世代まで進んでいるかはスクリプトからは分からず、取り違えると
  次の `db:migrate` が**適用済みの DDL を再実行して止まる**。
  - 実測: 現行スキーマの DB に最初の 1 本だけ記録 → `ALTER TABLE Characters ADD reading` が
    **`ER_DUP_FIELDNAME`** で停止した。
  - **先に DB の実スキーマを確認してから指定する。** 現行スキーマなら最後の世代まで、
    `reading` が無い DB なら最初の 1 本まで。
  - 冪等（記録済みの世代は飛ばす）。接頭辞が一意なら省略形でもよい。
- `drizzle/` の現在の内容:
  1. `20260706112547_complex_wild_child` — 全テーブルの CREATE（ベースライン。この時点では `Characters.reading` が無い）
  2. `20260706112635_same_sleeper` — `Characters.reading` の ADD COLUMN
  3. `20260706112653_backfill_readings` — 61 キャラの `reading` を UPDATE で backfill（データのみ）
  - 採番は **drizzle-kit 1.0 系のタイムスタンプ形式**（`0000_` のような連番は付かない）。適用順は名前の昇順。
- `server-ts/migrations/001_*.sql` は **generate 導入前に本番へ手で適用した SQL**。参照用に残す（再実行しない）。

### 5.1 マイグレーションは**フォルダごと**コミットする

**`drizzle/<name>/` には `snapshot.json` と `migration.sql` の 2 つが要る。両方をコミットする。**

- ⚠️ **`migration.sql` が無いフォルダを migrator は黙って読み飛ばす**
  （`readMigrationFiles` が `existsSync` で filter する）。
  結果、`db:migrate` は**何も流さずに成功メッセージを出す**。
- 実際に踏んだ: ルート `.gitignore` の `*.sql`（DB ダンプ避け）が生成 SQL まで巻き込み、
  `snapshot.json` だけが入った状態で 3 世代分がコミットされていた。
  `.gitignore` に `!server-ts/drizzle/**/*.sql` の除外解除を置いてある。**消さないこと**。
- 検算は「テーブルが実際にできたか」で行う。**成功メッセージは根拠にならない**。
  空 DB に `db:migrate` → `db:push` が `No changes detected` を返せばスキーマ一致。

#### `__drizzle_migrations.hash` は `migration.sql` の sha256 そのもの

**適用済み DB の記録と、手元のファイルの `sha256sum` を突き合わせられる。**
migrator は `crypto.createHash('sha256').update(<ファイル全文>)` で計算しているため、
`sha256sum migration.sql`（macOS は `shasum -a 256`）の値がそのまま入る。

- 用途: 「このファイルは本当にその DB に流れたものか」を **DB に書き込まずに検証できる**。
  失った SQL を別環境から回収したとき、正当性の判断がこれ一本で付く。
- ⚠️ **適用判定に使われるのは `name` だけ**（`getMigrationsToRun` は名前で突き合わせる）。
  hash が違っても再実行はされないし、警告も出ない。**hash は人間が検証するための材料**。

### 5.2 本番 DB のテーブル単位権限

本番のアプリ DB ユーザーは**テーブル単位の権限**しか持たない。
**新テーブルを追加したら明示的に GRANT する**こと。忘れると本番だけ errno 1142 で失敗し、**ローカルでは再現しない**。

## 6. 既知のスキーマ上の負債

- `UserStates.twitter_id` だけ **varchar(20)**（他は varchar(32)）。現行の X ユーザー ID は 19 桁程度なので実害は出ていないが、揃っていない。
- 投票のキーが `user.id` ではなく **`twitter_id`** である。`user.twitter_id` が UNIQUE なので整合はするが、
  X 以外の認証プロバイダを足すと破綻する。移行は独立タスク（[09](./09-roadmap.md) §2）。
- `level` に DB 制約がない（`tinyint unsigned` のみ）。重複・非連続を防いでいない（[04](./04-voting.md) §4）。

## 7. パフォーマンス原則

- 規模感: ユーザー数は数百〜、キャラ 61、pair は最大 61×60。**MySQL 8.4 には十分小さい**。
- **これ以上の事前集計テーブルは作らない**。`DailyOshiCount` で足りている。実測で遅いクエリが出たら初めて検討する。
- 重いのは `GET /analysis`（全 61 キャラ分の pair 集計を並列に投げる）。これは **ISR で 1 日 1 回**しか呼ばれない前提で許容している（[08](./08-frontend.md) §2）。
