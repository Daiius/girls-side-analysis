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
| Lint | **Biome 2**（**リンターのみ**。フォーマッタは無効） | 設定は `biome.jsonc`。§6.1 |

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
| `pnpm dev` | `docker compose up --watch --build`（**`docker compose watch` 単体は同期しかせずサービスを起動しない**） |
| `pnpm stop` / `pnpm down` | compose stop / down |
| `pnpm db:push` | `drizzle-kit push --force`（**dev/CI の使い捨て DB 専用**。履歴を残さない） |
| `pnpm db:migrate` | `server-ts/drizzle/*` を順に適用（**本番はこちら**） |
| `pnpm db:seed` | `addTestData.ts`（キャラ 61 件 + 状態マスタ + テスト投票 + DailyOshiCount backfill） |
| `pnpm test` | `docker compose exec server pnpm test`（Vitest） |
| `pnpm lint` | Biome（**ホストの作業ツリーを bind mount した使い捨てコンテナ**で実行。§6.1） |

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

### 6.1 Lint と CI

- `build-push.yml` は手動起動のイメージビルドのみで、自動 CI ではない。
- かつて **lint は実体が無かった**。`next/package.json` の `"lint": "next lint"` は
  **Next 16 でコマンドが廃止済み**で動かず、ESLint / Biome とも依存・設定ファイルが無かった。

#### ✅ 決定（2026-08-04・2026-07-10 の決定を改訂）

**Biome を導入する。ただしリンターのみを有効にし、フォーマッタと assist は無効にする。**
設定は **`biome.jsonc`**（ルート）。lint CI を `.github/workflows/lint.yml` で回す。

- **フォーマッタを無効にする理由**: 既存コードの整形方針が **`next` はセミコロンあり /
  `server-ts` はなし**とパッケージ間で揃っておらず、単一の設定ではどちらかが必ず崩れる。
  実測では、現行スタイルに寄せた設定でも **63 / 63 ファイル・約 1,380 行**（総 4,694 行の約 29%）、
  Biome 既定設定なら **約 3,600 行（約 77%）** が書き換わる。整形は各自の裁量に委ねる。
- `assist` も無効。`organizeImports` が import 並べ替えで同規模の差分を生むため。
- **off にしたルール**: `noNonNullAssertion`（検出はすべて luxon の `toISODate()!`。
  luxon の型が `string | null` なだけで実際は非 null）/ `noArrayIndexKey`（固定文字列を
  split しただけの配列で並び替えが起きない）。理由は `biome.jsonc` のコメントにも書く。
- 個別の抑制は `// biome-ignore lint/<group>/<rule>: 理由` を **1 行で**書く
  （複数行に折り返すと 1 行目しか読まれず効かない）。
- ⚠️ **`--error-on-warnings` を必ず付ける**。Biome は **warning だけなら exit 0** を返すため、
  付けないと warning 相当のルール（未使用 import 等）が `pnpm lint` でも CI でも素通りする。
  導入時の指摘 63 件のうち **52 件が warning** だったので、これが無いと関門として機能しない。
- ⚠️ **設定ファイルは `biome.json` ではなく `biome.jsonc`**。`biome.json` はコメントが使えず、
  しかも**構文エラーでもエラーにならず既定設定にフォールバックして `.next/` のビルド生成物まで
  lint し始める**。設定を変えたら必ず検査対象ファイル数を見ること。
- **`pnpm lint` は「ホストの作業ツリーを bind mount した使い捨てコンテナ」で実行する**
  （`docker compose run --rm --no-deps --build -v "$PWD":/repo`）。他のルート script のような
  `docker compose exec` にしない理由:
  - コンテナ内のソースは compose watch の **sync（ホスト → コンテナの一方向）**でしか更新されない。
    `pnpm dev` を動かしていない間は**コンテナ側が古い**ままなので、`exec` だと古いコードを lint しうる。
  - bind mount なら dev スタックが停止していても動く。
  - `Dockerfile.dev` が `biome.jsonc` を COPY し compose watch にも sync 規則を置いてあるのは、
    `exec` で入った場合やイメージ内で完結させたい場合のため。
  - ⚠️ **`--build` は必須**。Biome はイメージ内の `node_modules` に入っているので、
    ブランチを取得しただけで**イメージが古いままだと `biome` が存在せず lint が失敗する**。
    Biome のバージョンを上げた時に古いリンターで検査してしまう事故も防ぐ。
    レイヤキャッシュが効くので、変更が無ければ実行時間は 2 秒弱（コールドビルドで約 40 秒）。
- 🚫 **自動修正のスクリプトは置かない**。ホストに `node_modules` が無いためコンテナから書き戻す形になるが、
  **書き込んだファイルの所有者が Docker の rootless / rootful で逆になる**
  （rootless では**コンテナ内 root**がホストの自分にマップされ、rootful ではホストと同じ uid の指定が要る）。
  環境依存のスクリプトを公開リポジトリに置くより、エディタの Biome 拡張か、各自の環境に合わせた
  `biome lint --write` の直接実行に委ねる。

#### 改訂前の決定（2026-07-10）との差分

| 項目 | 2026-07-10 の決定 | 現在 |
|---|---|---|
| Biome のフォーマッタ | 有効（行幅 100 / セミコロンは必要時のみ / `useSortedClasses`） | **無効**（上記の実測による） |
| 設定ファイル | `biome.json` を別リポから流用 | **`biome.jsonc`**（コメントを残すため） |
| CI | `ci.yml` に **Biome + typecheck + test の 3 点セット** | **lint のみ**（`lint.yml`）。残り 2 つは未着手 |

- 🚫 **pre-commit hook は採用しない**。ホストに `node_modules` を置かない docker 専用の
  開発形態では、hook から Biome を呼ぶのに dev スタック起動を前提にするか
  `pnpm dlx` でバージョンを二重管理するかになり、どちらも壊れやすい。
  hook は各開発者の `core.hooksPath` 設定が要り `--no-verify` ですり抜けられる。**関門は CI に置く**。
- ⏳ **未着手**: `typecheck`（`tsc --noEmit`）スクリプトの新設と CI への追加、
  および CI での vitest 実行（MySQL は `services: mysql:8.4`）。[09](./09-roadmap.md) §2.5 参照。
- 📌 フォーマッタを後から入れる場合は、整形のみのコミットを 1 本に切って
  その SHA を `.git-blame-ignore-revs` に登録すれば blame は汚れない（[09](./09-roadmap.md) §2.5）。

## 7. `server-rs` の位置づけ（凍結）

- `server-rs/`（axum + sea-orm + utoipa）は **`server-ts` と同等の API を Rust で書き直す実験実装**。
- ✅ **凍結と決定（2026-07-10）**。維持はするが、**`server-ts` への追随義務を負わない**（乖離していても不具合ではない）。
- 実態: 約 540 行、ハンドラは 4 つ（`characters` / `user_state` の GET・POST / `statuses`）のみ。
  **投票・分析・集計は未実装**。最終更新は 2025-07-30 で、2026-05 の 3 テーブル再設計を反映していない。
- **pnpm workspace にも `compose.yaml` にも含まれない**。CI もテストも通っていない。
- **稼働系は `server-ts` である**。仕様の原典はこの PRD であり、`server-ts` がそれを実装する。
