# CLAUDE.md

GS シリーズファン向けの「推し投票・組み合わせ分析」Web アプリ。
背景・設計の経緯・試行錯誤の記録は [README.md](./README.md) と [docs/](./docs/) を参照（このファイルでは繰り返さない）。

## 構成（pnpm monorepo）

- `next/` — Next.js フロントエンド（App Router / React / chart.js / dnd-kit / better-auth）
- `server-ts/` — API サーバ（Hono + Drizzle ORM + MySQL、node-cron で定期集計）。`next` は Hono RPC で `@daiius/girls-side-analysis-server-ts/client` を型付き import する
- `server-rs/` — Rust（axum + sea-orm）製サーバ。pnpm workspace / 開発用 compose には含まれない別実装
- 共通依存は `pnpm-workspace.yaml` の `catalog:` で一元管理（各 `package.json` は `catalog:` を参照）

## 開発

ルートの `package.json` scripts は docker compose 経由で動く。基本はルートから操作する:

- `pnpm dev` — `docker compose watch` で全サービス起動＋ソース同期（next:3000 / server-ts:4000 / MySQL:3306）
- `pnpm stop` / `pnpm down`
- `pnpm db:migrate` — `drizzle-kit push` でスキーマ反映
- `pnpm db:seed` — テストデータ投入
- `pnpm test` — server-ts の vitest を実行

個別パッケージ内では `pnpm <script>`（next: `dev`/`build`/`lint`、server-ts: `dev`/`build`/`test`/`db:*` など）。

## 前提・規約

- パッケージマネージャは pnpm 固定（`packageManager` 参照）。npm/yarn は使わない
- DB は MySQL 8.4。スキーマは `server-ts/src/db/schema.ts`（Drizzle）。マイグレーションは drizzle-kit push 方式
- サプライチェーン対策で `minimumReleaseAge`（公開 3 日未満の新バージョンは不採用）を設定済み。lockfile は尊重する
- 認証は better-auth の session ベース。JWT と DB session の併用はしない
- env ファイル（`next/.env.*` / `server-ts/.env.*`）は gitignore 済み・コミットしない

## 注意点（gotcha）

- 日本語（非 ASCII）のルートパスがあり、Next.js のキャッシュ／revalidate 周りで挙動が素直でない箇所がある（README の開発記録参照）
- dev では next / server が同一 Docker イメージ `girls-side-analysis-dev` を共有。bind mount ではなく compose watch の sync で同期する（`compose.yaml` のコメント参照）

## コミット

- public リポジトリ。シークレット・PII・本番インフラの内部手順はコミットに含めない

<!-- 個人用設定（git 管理外・存在しない環境では無視される） -->
@.claude/local/CLAUDE.md
