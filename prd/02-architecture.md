# 02. アーキテクチャ

本章は技術構成・パッケージ分割・開発環境・依存ポリシー・デプロイ姿勢を定める。
データモデルは [03](./03-data-model.md)、API 契約は [07](./07-api.md)、フロント詳細は [08](./08-frontend.md) に委ねる。

---

## 1. 全体像

- **pnpm monorepo**（`pnpm-workspace.yaml` の packages は `next` と `server-ts` のみ）。
- **フロント（`next`）と API（`server-ts`）は別々の環境にデプロイされ、別オリジンで動く。**
  これが CORS・cookie ドメイン共有・API キー配置の設計を規定する（[06](./06-auth-and-privacy.md) §3）。
  DB は API と同じ環境の MySQL 8.4。
- `next` は `server-ts` を **Hono RPC の型として import** する。API の形が変われば型エラーで即座に検出される。

```
 フロント環境                         API 環境
┌──────────────┐                   ┌──────────────────────────┐
│  next        │ ──Bearer API_KEY─→ │ server-ts (Hono)         │
│  App Router  │   + cookie 転送    │  ├ better-auth handler   │
│  ISR / SSR   │ ←── JSON ────────  │  └ node-cron 00:01 JST   │
└──────────────┘                   └──────────┬───────────────┘
        ▲                                     │ Drizzle (mysql2)
        │ ブラウザは /api/auth/* のみ           ▼
        │ API サーバへ直接（cross-origin）  MySQL 8.4
```

> デプロイ先の具体名・ドメイン・接続情報は**公開リポジトリに書かない**（§6）。

## 2. 技術スタック

| 領域 | 採用 | 備考 |
|---|---|---|
| 言語 | TypeScript（ESM） | 両パッケージとも `"type": "module"` |
| DB | **MySQL 8.4** | |
| ORM | **Drizzle ORM 1.0.0-rc.3** | `drizzle-kit` も同 rc に **exact pin**（catalog 外） |
| API | **Hono 4 + @hono/node-server** | `hono/client` の `hc` で型付き RPC |
| 入力検証 | **zod v4**（`zod/v4` サブパス）+ `@hono/zod-validator` | |
| 認証 | **better-auth**（X/Twitter OAuth のみ） | [06](./06-auth-and-privacy.md) |
| フロント | **Next.js 16 (App Router) + React 19** | ISR + Server Actions |
| スタイル | **Tailwind CSS v4**（CSS ファースト） | `daisyUI は不使用`。UI プリミティブは Headless UI + Heroicons |
| 可視化 | **chart.js 4** | 折れ線のみ。必要モジュールだけ個別 register |
| D&D | **dnd-kit** | 推しの順位付け |
| 日時 | **luxon** | TZ は常に `Asia/Tokyo` を明示 |
| バッチ | **node-cron 4**（in-process） | 型同梱のため `@types/node-cron` 不要 |
| テスト | **Vitest 4**（server-ts のみ） | 実 MySQL に対する統合テスト（[05](./05-analysis.md) §7） |
| パッケージ管理 | **pnpm 10**（workspace + catalog） | `packageManager` で固定。npm/yarn は使わない |
| 開発環境 | **docker compose watch** | bind mount を使わない |

## 3. パッケージ構成

```
next/        # Next.js フロントエンド
server-ts/   # Hono API + 集計 cron
server-rs/   # Rust(axum + sea-orm) の別実装。workspace / compose の外（§7）
```

### 3.1 依存方向と型共有

- `next` は `server-ts` を **devDependency の `workspace:*`** で参照する（実行時依存ではない）。
- `server-ts/package.json` の `exports` は **TypeScript ソースを直接公開**する:

| サブパス | 実体 | 用途 |
|---|---|---|
| `.` | `src/app.ts` | `AppType`（RPC 型）。server 自身のエントリでもある |
| `./client` | `src/client.ts` | **副作用なしの型専用エントリ**。`AppType` と `hc` だけを再エクスポート |

- `next` は必ず **`@daiius/girls-side-analysis-server-ts/client`** から import する。
  ルートエントリ（`src/app.ts`）を踏むと **better-auth の初期化と `process.env` 必須チェックがフロント側で評価されてしまう**ため。
- 依存は一方向（`next → server-ts`）。`server-ts` は `next` を知らない。

## 4. 開発環境（docker compose watch）

- `compose.yaml` が `nextjs`（:3000）/ `server`（:4000 → コンテナ内 3000）/ `database`（:3306）を起動。
- **`nextjs` と `server` は同一イメージ `girls-side-analysis-dev` を共有**する（`Dockerfile.dev`）。
  両サービスに同じ `build` を書くのは、`pnpm-lock.yaml` 変更時の watch `rebuild` を**両方で効かせる**ため
  （`image` 共有だけだと server 側の rebuild が発火しない）。ビルド実体は片方のキャッシュヒットで済む。
- **bind mount を使わず `docker compose watch` の `sync` で同期**する。virtiofs のイベント取りこぼしを避け、HMR を安定させる。
  - `nextjs`: `./next` と **`./server-ts` も** sync（RPC 型を import するため）。
  - `server`: `./server-ts` を sync のみ（`tsx watch` が自前で再起動するので `sync+restart` は不要）。
  - `pnpm-lock.yaml` の変更でのみ `rebuild`。
- 開発 DB は named volume（`db-data`）で永続化。スキーマ反映と seed は one-shot サービスではなく明示コマンドで行う。

### 4.1 コマンド（ルート `package.json`。すべて compose 経由）

| コマンド | 実体 |
|---|---|
| `pnpm dev` | `docker compose watch` |
| `pnpm stop` / `pnpm down` | compose stop / down |
| `pnpm db:push` | `drizzle-kit push --force`（**dev/CI の使い捨て DB 専用**。履歴を残さない） |
| `pnpm db:migrate` | `server-ts/drizzle/*` を順に適用（**本番はこちら**） |
| `pnpm db:seed` | `addTestData.ts`（キャラ 61 件 + 状態マスタ + テスト投票 + DailyOshiCount backfill） |
| `pnpm test` | `docker compose exec server pnpm test`（Vitest） |

個別パッケージ内では `pnpm <script>`（`server-ts`: `db:generate` / `db:baseline` / `db:backfill` / `build` など）。

## 5. 依存ポリシー

- **pnpm `catalog:`**: 両パッケージで共有する依存（`better-auth` / `luxon` / `tsx` / `typescript` / `@types/*`）は
  `pnpm-workspace.yaml` の `catalog:` に集約し、各 `package.json` は `"catalog:"` で参照する。版ズレ事故を防ぐ。
- **`minimumReleaseAge: 4320`（3 日）**: 公開直後の悪意あるリリースを踏みにくくするサプライチェーン対策。
  lockfile は尊重する（`--frozen-lockfile` 前提）。
- **`onlyBuiltDependencies`**: postinstall ビルドを許可するのは `@tailwindcss/oxide` / `esbuild` / `sharp` のみ。
- **Drizzle は RC を exact pin**（`drizzle-orm` / `drizzle-kit` とも `1.0.0-rc.3`）。catalog に入れず、
  `minimumReleaseAge` の影響を受けない形で版を固定する。
- **`.env*` はコミットしない**（`.gitignore` 済み）。DB ダンプ（`*.sql` / `*.sql.gz`）も同様。

## 6. ビルドとデプロイ

- `server-ts` は **esbuild で `dist/index.js` に単一バンドル**（`esbuild.config.ts`、ESM / node20 target）し、
  最小構成のコンテナイメージに置く（`Dockerfile.server.prod`）。
- イメージのビルドとレジストリへの push は `.github/workflows/build-push.yml`（`workflow_dispatch` の手動起動）で行う。
- ⚠️ **本番イメージ（linux/amd64）のビルドは必ず GitHub Actions で行う**。
  arm64 Mac 上のエミュレートビルドは libuv の io_uring 周りでクラッシュする。
- `next` はホスティング事業者側でビルド・配信される。
- ⚠️ **本リポジトリは public である。** デプロイ先の事業者名・ドメイン・TLS / リバースプロキシ構成・接続先・
  シークレット・DB 権限付与の実手順といった**環境の具体情報は書かない**。
  必要な運用メモは gitignore 対象の `.claude/local/` に置く。

### 6.1 CI（未整備 → 導入決定）

- **現状、自動 CI は存在しない**。`build-push.yml` は手動起動のイメージビルドのみ。
- さらに **lint も typecheck も実体がない**:
  - ESLint / Biome とも依存・設定ファイルが無い。`next/package.json` の `"lint": "next lint"` は
    **Next 16 でコマンドが廃止済み**で動かない。
  - `typecheck` スクリプトがルート・`next`・`server-ts` のどこにも無い。
- ✅ **決定（2026-07-10）**: **Biome + typecheck + test の 3 点セット**を GitHub Actions で回す。
  Biome 設定は同一著者の別リポの `biome.json` を流用（スペース 2 / 行幅 100 / シングルクォート /
  セミコロンは必要時のみ / `useSortedClasses`）。CI の MySQL は `services: mysql:8.4`。
  導入手順とコミットの切り方は [09](./09-roadmap.md) §2.5。

## 7. `server-rs` の位置づけ（凍結）

- `server-rs/`（axum + sea-orm + utoipa）は **`server-ts` と同等の API を Rust で書き直す実験実装**。
- ✅ **凍結と決定（2026-07-10）**。維持はするが、**`server-ts` への追随義務を負わない**（乖離していても不具合ではない）。
- 実態: 約 540 行、ハンドラは 4 つ（`characters` / `user_state` の GET・POST / `statuses`）のみ。
  **投票・分析・集計は未実装**。最終更新は 2025-07-30 で、2026-05 の 3 テーブル再設計を反映していない。
- **pnpm workspace にも `compose.yaml` にも含まれない**。CI もテストも通っていない。
- **稼働系は `server-ts` である**。仕様の原典はこの PRD であり、`server-ts` がそれを実装する。
