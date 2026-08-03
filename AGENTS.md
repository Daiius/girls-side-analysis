# AGENTS.md

GS シリーズファン向けの「推し投票・組み合わせ分析」Web アプリ。
**仕様の正典は [`prd/`](./prd/)**（下表）。実装レビュー・仕様判断はここを基準に行う。
背景・設計の経緯・試行錯誤の記録は [README.md](./README.md) と [docs/](./docs/) を参照（このファイルでは繰り返さない）。

## 仕様（PRD）

| 文書 | 内容 |
|---|---|
| [prd/README.md](./prd/README.md) | 目的 / スコープ / アーキ概観 / 索引・使い方 |
| [prd/01-domain.md](./prd/01-domain.md) | ドメイン事実（キャラ / 推し・順位・組み合わせ / プレイ状態 / 日の定義） |
| [prd/02-architecture.md](./prd/02-architecture.md) | 技術スタック / monorepo / 開発環境 / 依存ポリシー / デプロイ |
| [prd/03-data-model.md](./prd/03-data-model.md) | DB スキーマ / 3 テーブル設計 / 日付と TZ / マイグレーション運用 |
| [prd/04-voting.md](./prd/04-voting.md) | 投票の入力仕様・書き込み規則・差分判定・認可 |
| [prd/05-analysis.md](./prd/05-analysis.md) | pair 集計 / 夜間 cron / 時系列 / 決定性ルール |
| [prd/06-auth-and-privacy.md](./prd/06-auth-and-privacy.md) | better-auth / X OAuth / owner 境界 / 公開範囲 |
| [prd/07-api.md](./prd/07-api.md) | API 契約（エンドポイント・認証レイヤ・RPC 型共有） |
| [prd/08-frontend.md](./prd/08-frontend.md) | ページ / ISR とキャッシュ / UI / SEO・a11y |
| [prd/09-roadmap.md](./prd/09-roadmap.md) | 着手する不備 / 次の機能追加 / 将来案 / 決着済みの論点 |
| [prd/appendix-characters.md](./prd/appendix-characters.md) | 付録 A: キャラクター一覧（名簿の原典）と変更手順 |

> **PRD が原典**。実装（`schema.ts` / `app.ts` / `charactersMaster.ts` など）は PRD に従う。
> 仕様変更を伴う PR は、該当章の更新を同じ PR に含める。
> PRD が実装より古い・誤っていると分かったら、PRD を直す（実装を黙って正とみなさない）。

## 構成（pnpm monorepo）

- `next/` — Next.js フロントエンド（App Router / React / chart.js / dnd-kit / better-auth）
- `server-ts/` — API サーバ（Hono + Drizzle ORM + MySQL、node-cron で定期集計）。`next` は Hono RPC で `@daiius/girls-side-analysis-server-ts/client` を型付き import する
- `server-rs/` — Rust（axum + sea-orm）製サーバ。pnpm workspace / 開発用 compose には含まれない別実装
- 共通依存は `pnpm-workspace.yaml` の `catalog:` で一元管理（各 `package.json` は `catalog:` を参照）

## 開発

ルートの `package.json` scripts は docker compose 経由で動く。基本はルートから操作する:

- `pnpm dev` — `docker compose up --watch --build` で全サービス起動＋ソース同期（next:3000 / server-ts:4000 / MySQL:3306）
- `pnpm stop` / `pnpm down`
- `pnpm db:push` — dev/CI 用に `drizzle-kit push` でスキーマ強制同期（履歴を残さない使い捨て DB 向け）
- `pnpm db:migrate` — バージョン管理マイグレーション（`server-ts/drizzle/*`）を適用。本番はこちら
- `pnpm db:seed` — テストデータ投入
- `pnpm test` — server-ts の vitest を実行
- `pnpm lint` — biome（リンターのみ）。設定は `biome.jsonc`

個別パッケージ内では `pnpm <script>`（next: `dev`/`build`/`start`、server-ts: `dev`/`build`/`test`/`db:*` など）。

## 前提・規約

- パッケージマネージャは pnpm 固定（`packageManager` 参照）。npm/yarn は使わない
- DB は MySQL 8.4。スキーマは `server-ts/src/db/schema.ts`（Drizzle）
  - 本番マイグレーションは drizzle-kit の generate/migrate 方式（`server-ts/drizzle/` にバージョン管理、`db:generate` で生成し `db:migrate` で適用）。既存 DB を初めて管理下に載せる時は一度だけ `db:baseline` で 0000 を適用済み登録する
  - dev/CI の使い捨て DB は従来どおり `db:push`（強制同期）でよい
  - 歴史的経緯で手書き SQL の `server-ts/migrations/001_*.sql` が残る（generate 導入前の本番適用済み分。参照用）
- サプライチェーン対策で `minimumReleaseAge`（公開 3 日未満の新バージョンは不採用）を設定済み。lockfile は尊重する
- Lint は **biome のリンターのみ**（`biome.jsonc`）。**フォーマッタと assist は意図的に無効**にしてある
  - 既存コードの整形方針が next（セミコロンあり）と server-ts（なし）で揃っておらず、
    フォーマッタを有効にすると全 63 ファイル・約 1,400 行が書き換わるため。整形は各自の裁量に委ねる
  - `noNonNullAssertion` と `noArrayIndexKey` は off。理由は `biome.jsonc` のコメント参照
  - 個別に抑制するときは `// biome-ignore lint/<group>/<rule>: 理由` を**1 行で**書く
    （複数行に折り返すと 1 行目しか読まれず効かない）
  - ⚠️ **`--error-on-warnings` は必須**。biome は warning だけなら exit 0 を返すので、
    付けないと未使用 import 等が CI をすり抜ける。`pnpm lint` と CI の両方に入れてある
  - **自動修正のスクリプトは用意していない**。ホストに `node_modules` を置かない構成のため、
    コンテナから書き戻す形になるが、**ファイルの所有者が Docker の rootless / rootful で逆になる**
    （rootless はコンテナ内 root、rootful はホストと同じ uid を指定する必要がある）。
    環境依存のスクリプトを置くより、エディタの Biome 拡張を使うか、自分の環境に合わせて
    `biome lint --write` を直接叩く
- 認証は better-auth の session ベース。JWT と DB session の併用はしない
- env ファイル（`next/.env.*` / `server-ts/.env.*`）は gitignore 済み・コミットしない

## 注意点（gotcha）

- 日本語（非 ASCII）のルートパスがあり、Next.js のキャッシュ／revalidate 周りで挙動が素直でない箇所がある（README の開発記録参照）
- dev では next / server が同一 Docker イメージ `girls-side-analysis-dev` を共有。bind mount ではなく compose watch の sync で同期する（`compose.yaml` のコメント参照）

## 個人用ローカルメモ

作業開始時に `.claude/local/CLAUDE.md` が存在する場合は読む。
このファイルは git 管理外の個人用メモであり、内容をコミット・要約公開・ログ転記しない。
存在しない環境では無視する。

## コミット・PR

- public リポジトリ。シークレット・PII・本番インフラの内部手順はコミットに含めない
- **マージは merge commit で行う**（squash / rebase は使わない）。`gh pr merge <PR> --merge`
  - PR 内のコミットを個別に残し、`Merge pull request #NN from ...` で PR 単位の区切りを履歴に刻む
  - **マージ済みブランチは削除しない**（`--delete-branch` を付けない）
