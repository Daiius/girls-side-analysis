# 03. データモデル

本章は DB スキーマ（MySQL 8.4 / Drizzle）を定める。**正典は [`server-ts/src/db/schema.ts`](../server-ts/src/db/schema.ts)**、
本章はその意図と制約を説明する。ドメイン定義は [01](./01-domain.md)、書き込み規則は [04](./04-voting.md)、
集計は [05](./05-analysis.md) を参照。

---

## 1. テーブル一覧

| テーブル | 役割 | 書き込み主体 |
|---|---|---|
| `Characters` | キャラクターマスタ（62 件）。公式順 `(series, sort)` の定義元 | seed / マイグレーションのみ |
| `Votes` | **投票履歴の不変ログ**（日単位） | 投票時（当日分を置換） |
| `LatestVotes` | **ユーザーごとの現在の推し set** | 投票時（per-user で全置換） |
| `DailyOshiCount` | **過去日の pair 集計 snapshot** | 夜間 cron / 手動 backfill |
| `UserStatesMaster` | プレイ状態の選択肢マスタ（3 件） | seed |
| `UserStates` | ユーザー × シリーズ × 日 のプレイ状態 | 投票時（upsert） |
| `user` / `session` / `account` / `verification` | better-auth 管理の認証テーブル | better-auth |

## 2. 3 テーブル設計（Votes / LatestVotes / DailyOshiCount）

このアプリは **read >> write**（閲覧は常時、投票は稀）である。にもかかわらず旧実装は
「毎 read で `Votes` 全体を走査して各ユーザーの最新投票を計算し直す」構造で、トップページは
**全 62 キャラ × その重いクエリ**、キャラページは **30 日分 × 同クエリ**を走らせていた。

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
| **本番** | `pnpm db:generate` → `pnpm db:migrate` | `server-ts/drizzle/*` にバージョン管理 |
| 既存 DB を初めて管理下に載せる | `pnpm db:baseline`（**一度だけ**） | `0000` を「適用済み」として記録（SQL は実行しない） |

- `db:baseline` を忘れて `db:migrate` を打つと、`0000` の `CREATE TABLE` が既存テーブルと衝突する。**新規 DB では baseline 不要**。
- `drizzle/` の現在の内容:
  1. `20260706112547_complex_wild_child` — 全テーブルの CREATE（ベースライン。この時点では `Characters.reading` が無い）
  2. `20260706112635_same_sleeper` — `Characters.reading` の ADD COLUMN
  3. `20260706112653_backfill_readings` — 62 キャラの `reading` を UPDATE で backfill
- `server-ts/migrations/001_*.sql` は **generate 導入前に本番へ手で適用した SQL**。参照用に残す（再実行しない）。

### 5.1 本番 DB のテーブル単位権限

本番のアプリ DB ユーザーは**テーブル単位の権限**しか持たない。
**新テーブルを追加したら明示的に GRANT する**こと。忘れると本番だけ errno 1142 で失敗し、**ローカルでは再現しない**。

## 6. 既知のスキーマ上の負債

- `UserStates.twitter_id` だけ **varchar(20)**（他は varchar(32)）。現行の X ユーザー ID は 19 桁程度なので実害は出ていないが、揃っていない。
- 投票のキーが `user.id` ではなく **`twitter_id`** である。`user.twitter_id` が UNIQUE なので整合はするが、
  X 以外の認証プロバイダを足すと破綻する。移行は独立タスク（[09](./09-roadmap.md) §2）。
- `level` に DB 制約がない（`tinyint unsigned` のみ）。重複・非連続を防いでいない（[04](./04-voting.md) §4）。

## 7. パフォーマンス原則

- 規模感: ユーザー数は数百〜、キャラ 62、pair は最大 62×61。**MySQL 8.4 には十分小さい**。
- **これ以上の事前集計テーブルは作らない**。`DailyOshiCount` で足りている。実測で遅いクエリが出たら初めて検討する。
- 重いのは `GET /analysis`（全 62 キャラ分の pair 集計を並列に投げる）。これは **ISR で 1 日 1 回**しか呼ばれない前提で許容している（[08](./08-frontend.md) §2）。
