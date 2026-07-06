import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit のバージョン管理マイグレーション設定。
 *
 * - `db:generate` … schema.ts の差分から drizzle/NNNN_*.sql を生成
 * - `db:migrate`  … 未適用の drizzle/*.sql を順に適用（本番は管理ユーザで）
 * - `db:baseline` … 既存 DB を 0000 で「適用済み」登録する一回限りの初期化
 *
 * 従来の `drizzle-kit push`（スキーマ強制同期）は履歴を残さないため
 * dev / CI の使い捨て DB 専用として `db:push` に残す（本番では使わない）。
 *
 * dbCredentials は `db:migrate` 等の tsx スクリプトが src/db 経由で参照するため
 * ここでは pull / studio 等 CLI から使う場合の保険。generate はオフラインで動く。
 */
export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE ?? '',
  },
})
