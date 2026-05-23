# next-auth → better-auth 移行計画

ブランチ: `feature/auth-better-auth-migration`

## 背景

next-auth v5 (beta.30) で OAuth state cookie の parse が失敗するエラーが本番でも発生。
beta 仕様であることもあり、最新の Next.js 16 と相性の良い **better-auth** に乗り換える。

並行して、認証関連の責務を **server-ts (Hono) 側に集約**することで、
DB が同居しているセルフホストサーバの設計と整合させる
（Vercel → セルフホスト DB の直接接続を回避する既存方針を踏襲）。

## アーキテクチャ

```
[Client (Browser)]
  │  (cookie: session token, HttpOnly)
  ▼
[Next.js on Vercel (next/)]
  - proxy.ts            : `/profile` 等の保護対象 path で session 検証→未認証なら redirect
  - lib/auth-session.ts : Server Component / Server Action から session を取るヘルパー
  - next.config.ts      : rewrites で `/api/auth/*` を server-ts に転送（same-origin で cookie を共有）
  - actions/voteActions : session.user.twitterId をそのまま `insertVotesIfUpdated` に渡す
  │  (HTTP, Bearer API_KEY) (HTTP via rewrites, same-origin)
  ▼                                     ▼
[Hono server (server-ts/) on self-hosted]
  - app.ts              : auth.handler を `/api/auth/*` に mount
  - lib/auth.ts         : betterAuth(...) instance（drizzleAdapter + Twitter provider + user.additionalFields）
  - db/schema.ts        : 既存テーブル + 認証用テーブル（user / session / account / verification）
  - 既存の Bearer apiKey middleware は `/api/auth/*` を除外
  │
  ▼
[MySQL on self-hosted]
  - 既存: Characters, Votes, UserStates
  - feature ブランチでは LatestVotes, DailyOshiCount も別途追加予定（別ブランチ）
  - 新規: user, session, account, verification
```

### session 検証フロー（session id 一本戦略）

DB の `session` テーブルを真実とする。**JWT は併用しない**（二重管理を避ける）。

1. ユーザーが「ログイン」ボタンを押す → `authClient.signIn.social({ provider: 'twitter' })`
2. next の `/api/auth/sign-in/social/twitter` が rewrites で server-ts へ転送
3. better-auth が Twitter OAuth へリダイレクト → コールバック処理
4. better-auth が `user` / `account` / `session` を DB に作成し、cookie に session token を載せて返す
5. 以降のリクエストでは next が cookie ごと server-ts の `getSession` を叩いて検証
6. session 検証結果（`user`, `twitterId`, ...）を Server Component / Server Action で利用

server 往復のコストは、本番では reverse proxy 経由のため数十 ms 程度。
頻繁に session を引く page では Next.js の Request Memoization（同一レンダーで重複呼びを排除）でカバー。

### twitter_id の互換性（案 A 修正版）

- better-auth の `user.id` は internal UUID
- Twitter user id は `account.accountId` (providerId='twitter') に入る
- better-auth の `user.additionalFields` で `twitterId` 拡張カラムを定義
- `databaseHooks.user.create.after` で account レコードから twitterId を引いて user.twitterId に書き戻す
  → 以降は `session.user.twitterId` で即座に取得可能
- 既存の `Votes.twitter_id` / `UserStates.twitter_id` はそのまま不変
- 既存ユーザーが初回ログインしたら、自分の Twitter id が `account.accountId` と `user.twitterId` に保存される
  → 過去の投票履歴とそのまま紐づく

## スキーマ追加（server-ts/src/db/schema.ts）

better-auth 公式の MySQL スキーマに準ずる。`@better-auth/cli generate` で雛形を出して
既存スキーマに統合する想定。**JWT plugin を使わないので `jwks` テーブルは不要**。

| テーブル | 役割 |
|---|---|
| `user` | better-auth のユーザ。`id` (UUID), `name`, `email`, `image`, `twitterId` (拡張カラム), `createdAt`, `updatedAt` |
| `session` | DB セッション。`id`, `token`, `userId`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt` |
| `account` | OAuth 連携。`id`, `userId`, `accountId` (= twitter user id), `providerId` ('twitter'), `accessToken`, `refreshToken`, ..., `createdAt`, `updatedAt` |
| `verification` | メール検証等の汎用ストア（Twitter のみの構成では未使用だが必須） |

## 環境変数の差分

### 削除

| 旧名 | 場所 |
|---|---|
| `AUTH_SECRET` | next/.env.local |
| `AUTH_TRUST_HOST` | next/.env.development |
| `AUTH_TWITTER_ID` | next/.env.development, next/.env.production |
| `AUTH_TWITTER_SECRET` | next/.env.development, next/.env.production |
| `MYSQL_*` | next/.env.production（next は DB に直接触らない方針のため）|

### 追加

| 新名 | 場所 | 値の取り方 |
|---|---|---|
| `BETTER_AUTH_SECRET` | server-ts/.env.development, server-ts/.env.production | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | server-ts/.env.development, server-ts/.env.production | フロントから見える URL（dev: `http://localhost:3000`、本番: Vercel ドメイン）|
| `TWITTER_CLIENT_ID` | server-ts/.env.development, server-ts/.env.production | 既存 AUTH_TWITTER_ID の値を流用 |
| `TWITTER_CLIENT_SECRET` | server-ts/.env.development, server-ts/.env.production | 既存 AUTH_TWITTER_SECRET の値を流用 |

### 留置（変更なし）

- `MYSQL_*`, `DB_HOST` (server-ts 側 DB 接続)
- `API_URL`, `API_KEY` (next ↔ server-ts API 連携)
- `HOST_URL`, `DEBUG`
- `URSA_AUTH_*` (別ブランチで継続作業中、本ブランチでは触らない)
- `TEST_TWITTER_ID` (テストデータ用)

## 実装着手リスト

順番に消化していく：

### Phase 1: 認証基盤（server-ts 側） ✅

- [x] **1.** server-ts に `better-auth` dep を追加（`^1.6.11`）
- [x] **2.** `server-ts/src/db/schema.ts` に user/session/account/verification を追加。`user.twitterId` を `additionalFields` 拡張カラムとして用意（既存 Votes/UserStates の `twitter_id` と紐付け用）
- [x] **3.** `server-ts/src/lib/auth.ts` で `betterAuth({...})` instance を作成
  - drizzleAdapter + Twitter provider（OAuth 2.0）
  - `user.additionalFields: { twitterId }`
  - `databaseHooks.account.create.after` で account.accountId（= Twitter user id）を user.twitterId に同期
  - JWT plugin は使わない（DB session 一本）
- [x] **4.** `server-ts/src/app.ts` で `/api/auth/*` を `auth.handler` に mount。既存 Bearer apiKey middleware は `/api/auth/*` を除外、CORS middleware も前置（本番 cross-origin 対応）
- [x] **5.** `server-ts/.env.development` に `BETTER_AUTH_SECRET / BETTER_AUTH_URL / TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET` を追加
- [x] **6.** docker compose の database-preparation → drizzle-kit push でローカル DB にスキーマ反映

### Phase 2: next 側の差し替え ✅

- [x] **7.** next に `better-auth` dep を追加（`^1.6.11`）
- [x] **8.** `next/next.config.ts` に rewrites を追加（`ENABLE_AUTH_REWRITES=true` のとき `/api/auth/*` を `${API_URL}/api/auth/*` に転送）
- [x] **9.** `next/src/lib/auth-client.ts` で `createAuthClient`。`baseURL` は `NEXT_PUBLIC_AUTH_BASE_URL` で切替（ローカル空＝same-origin、本番は API サーバ URL）
- [x] **10.** `next/src/lib/auth-session.ts` でサーバ側ヘルパー `getSession()`：cookie を rewrites or 直叩きで server-ts `/api/auth/get-session` に転送
- [x] ~~**11.** `next/src/proxy.ts` を新設、`/profile` で getSession を呼んで未認証なら redirect~~ → **削除**。`profile/page.tsx` 内で SSR 分岐（未ログインなら BeforeLoginProfile 表示）するので middleware/proxy 不要
- [x] **12.** `next/src/middleware.ts` を削除
- [x] **13.** `auth()` 呼び出しを `getSession()` に置換（`profile/page.tsx`, `VotingForm.tsx`, `voteActions.ts`）。`session.user.id` を `session.user.twitterId` に書き換え
- [x] **14.** `signIn('twitter')` を `authClient.signIn.social({ provider: 'twitter' })` に置換（`BeforeLoginProfile.tsx` を client component 化）
- [x] **15.** `signOut()` を `authClient.signOut()` に置換（`LogoutButton.tsx`）

### Phase 3: 古いコード削除 ✅

- [x] **16.** `next/src/auth.ts` を削除
- [x] **17.** `next/src/app/api/auth/[...nextauth]/route.ts` を削除
- [x] **18.** `next/package.json` から `next-auth` dep を削除
- [x] **19.** 環境変数の整理（`AUTH_SECRET / AUTH_TRUST_HOST / AUTH_TWITTER_ID / AUTH_TWITTER_SECRET` を next 側から削除）
- [x] 追加: `server-ts/src/client.ts` を作成。`hc` と `AppType` を type-only re-export することで、next 側から `@daiius/girls-side-analysis-server-ts/client` 経由で import しても lib/auth.ts の評価が走らないようにした
- [x] 追加: `actions/authActions.ts` を削除（authClient.signOut を直接呼ぶ）

### Phase 4: ローカル動作確認 ✅

- [x] **20.** docker compose で起動、playwright で /profile → ログインフロー
  - X Developer Portal で App が Project にひも付いていない場合は `/2/users/me` が 403 を返すため、Project enrollment が前提
  - scope は portal の承認（`users.read / tweet.read / users.email`）と完全一致させる必要あり。`offline.access` は portal 未承認のため `disableDefaultScope:true` で除外
  - email は `mapProfileToUser` で `${username}@twitter.local` 形式へフォールバック（schema 側で notNull のため）
- [x] **21.** 投票送信 → Votes に twitter_id 付きで insert されることを確認（`Daiius` でログイン、`氷上格 / 柊夜ノ介 / 葉月珪` で投票成功）
- [x] **22.** 既存 twitter_id (`272386273`) を持つユーザーが過去の seed 投票を引き継いで表示できることを確認
- [ ] **23.** revalidatePath が機能してトップ・キャラページが即更新されるか確認（未実施。`voteActions.ts` の revalidatePath は元コードでもコメントアウト状態だったため、保留）

### Phase 5: 本番マイグレーション ✅（2026-05-22 疎通完了）

- [x] **24.** 本番 DB へのスキーマ反映 — **Cloudflare tunnel 経由で `drizzle-kit push`** で実施
  - schema 差分は user/session/account/verification の純粋追加のみ（既存テーブル DDL 変更なし）
- [x] **25.** 本番環境変数を差し替え — **same-origin リバースプロキシ方式を採用**（元計画の cross-origin から変更）
  - 変更理由: **API サーバーの URL（`api.faveo-systema.net`）をブラウザに露出させたくない**ため。
    `/api/auth/*` を Vercel の rewrites でサーバ側から API へ転送し、ブラウザにはフロントのドメインだけ見せる。
    結果として CORS / cross-subdomain cookie 共有が不要になり構成も単純化。
  - Vercel: `ENABLE_AUTH_REWRITES=true`, `API_URL=https://api.faveo-systema.net/girls-side-analysis`,
    `NEXT_PUBLIC_AUTH_BASE_URL`=**空**（相対パスで same-origin に叩かせる）
  - server-ts: `BETTER_AUTH_SECRET`（dev とは別の新規生成値）, `BETTER_AUTH_URL=https://girls-side-analysis.faveo-systema.net`（=フロント origin。OAuth callback もこのドメイン経由になり API URL を秘匿）, `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`。`AUTH_COOKIE_DOMAIN` は**未設定**（same-origin なので host-only cookie で足りる）
  - X Developer Portal: Callback URL = `https://girls-side-analysis.faveo-systema.net/api/auth/callback/twitter`（フロント側ドメイン）
  - ⚠️ `NEXT_PUBLIC_*` / `API_URL` / `ENABLE_AUTH_REWRITES` は **ビルド時に焼き込まれる**ため、Vercel では値を設定後に**再デプロイ**が必要
- [x] **26.** `server-ts/Dockerfile.server.prod` のビルド → deploy — **GitHub Actions（Linux/amd64）でビルドし GHCR に push する方式で解決**
  - libuv assertion failure（exit 134）は arm64 Mac のローカル build 固有の問題。GH Actions の amd64 native runner でビルドすることで回避（手動 workflow `build-push.yml`、`ghcr.io/daiius/girls-side-analysis-server`）
- [x] **27.** デプロイ後の動作確認: Twitter ログイン → `/profile` まで疎通確認（2026-05-22）
  - ※ 投票 → 反映までの本番 end-to-end は最終確認を推奨（"多分一件落着" の段階）

### 本番デプロイで判明したトラブルと解消（2026-05-22）

順に踏んだ落とし穴の記録（再発防止）：

1. **GHCR push が 403 Forbidden** — ビルドは成功するが push 段階で失敗。原因はパッケージへの
   **リポジトリ Actions access 未付与**。`permissions: packages: write` だけでは不足で、
   パッケージ設定の「Manage Actions access」にリポジトリを Write で追加して解決。
2. **nginx の変数 `proxy_pass` で location prefix が剥がれず 404** — `set $upstream ...; proxy_pass $upstream;`
   の変数形式では nginx の自動 prefix 置換が無効になり、`/girls-side-analysis/analysis` がそのまま
   サーバへ渡って 404。静的 `proxy_pass http://...:3000/;`（または `rewrite ... break;`）で prefix を剥がして解決。
3. **ログインで `/api/auth/sign-in/social` が 404** — `NEXT_PUBLIC_AUTH_BASE_URL` 空のまま rewrites も無効で、
   ブラウザがフロント相対パスを叩いて 404。same-origin プロキシ方式（項目25）で確定。
4. **`please_restart_the_process`（OAuth コールバック失敗）の真因は DB 権限不足** — better-auth が
   `verification` の期限切れ行を掃除する `DELETE` を実行するが、本番 DB ユーザー `girls-side-analysis-user`
   に **DELETE 権限が無く** `ER_TABLEACCESS_DENIED_ERROR (1142)`。`GRANT SELECT,INSERT,UPDATE,DELETE ON
   girls_side_analysis.* TO ...` で付与。
   - ⚠️ **DB 単位の権限変更は既存接続（コネクションプール）が次の `USE` まで拾わない**。`SHOW GRANTS` に
     DELETE が出てもアプリが 1142 を出し続けたため、**database コンテナを再起動**して接続を張り直したら解消。

### 保留中の課題

- ~~**Docker build の libuv assertion failure**~~ → **解決**。arm64 Mac ローカル build 固有の問題で、GitHub Actions（amd64 Linux runner）でビルドし GHCR に push する方式に切り替えて回避（`build-push.yml`）。
- **next side の Phase 4-23 (revalidatePath)**: 元コードでもコメントアウトされていた処理。better-auth 移行と直接関係ないため保留。
- **next/.env.production の MYSQL_***: next 側から直接 DB アクセスしない設計なので、削除候補。本ブランチでは触らず保留。
- **本番 投票 → 反映の end-to-end 最終確認**: ログイン疎通までは確認済み。投票送信→トップ/キャラページ反映までの本番動作は念のため最終確認を推奨。

## 依存更新・開発環境刷新・日本語URL本番500対応（2026-05-24, main マージ済み）

better-auth 移行とは別軸の作業。`update/deps-2026-05` → PR #64、`fix/charaname-cache-tags` → PR #65 でいずれも main にマージ済み。

### 依存更新（PR #64）
- server-ts: hono / @hono/* / mysql2 / zod / esbuild 等を最新化。**pnpm catalog 導入**（`better-auth` / `luxon` / `@types/luxon` / `@types/node` / `tsx` / `typescript` を `pnpm-workspace.yaml` で一元管理）。
- next: 16.2.6 へ。@dnd-kit: core `^6.3.1` / modifiers v9 / sortable v10（DnD 動作確認済み）。
- サプライチェーン対策で `minimumReleaseAge: 4320`（3日）を設定。公開直後の版はインストールがブロックされる。

### 開発環境刷新（PR #64）
- **`docker compose watch` へ移行**: bind mount + 匿名 volume を撤廃。virtiofs のイベント取りこぼしが無くなり HMR 安定、FS もコンテナネイティブで高速、匿名 volume によるディスク肥大も解消。
- Dockerfile（next/server）: ソース焼き込み + `corepack` + pnpm store の BuildKit cache mount + `--frozen-lockfile`。
- **開発 DB を named volume で永続化**し one-shot seed サービスを廃止。スキーマ反映/初期データは `pnpm db:migrate` / `pnpm db:seed`（コンテナ内 exec、`DB_HOST=database`）に分離。seed（`addTestData.ts`）に**冪等化ガード**（既存データがあればスキップ）。
- npm スクリプト: `dev`(watch) / `stop` / `down` / `db:migrate` / `db:seed`。
- compose ファイルを **`compose.yaml` 命名規約**へ統一し、不整合だった `docker-compose.prod.yml` を削除。
- `.dockerignore`: root コンテキストの next ビルドを壊していた `next/` 除外を撤去（隠れた不具合）。
- `server-ts/Dockerfile.server.prod`: catalog 解決に必要な `pnpm-workspace.yaml` を COPY していなかったため GHCR ビルドが `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND` で失敗 → workspace レイアウトに整合させて修正。

### 日本語URLのキャラページが本番で500（PR #65）
- 症状: `/氷室零一` 等が Vercel で `TypeError: Invalid character in header content ["x-next-cache-tags"] (ERR_INVALID_CHAR)`。トップは無事。
- 原因: 静的/ISR ページ応答に付く `x-next-cache-tags` ヘッダにルートのパス名（非ASCII）が入り、Vercel ランタイムが Latin1 外を弾く。**Vercel minimal mode 限定**で self-hosted の `next start` では再現しない（ローカル本番ビルドは 200）。next 16.1.1→16.2.6 の回帰。
- upstream: issue vercel/next.js#92145、修正 PR vercel/next.js#93601（タグ生成時にエンコード）。**ただし 16.2.6 は同 PR マージの約4時間前に公開された未修正版**で、修正は 16.3.0-canary 系のみ。
- セキュリティ制約: 16.2.6 / 15.5.18 は 2026年5月の 13 CVE セキュリティリリース（SSRF 等）。**16.2.6 未満へのダウングレード不可**。
- 対応: `next` を **`16.3.0-canary.24`** にピン（修正含む / `minimumReleaseAge` を満たす公開3日以上の版）。`force-static` + `revalidatePath` の既存設計を維持したまま日本語 URL を扱える。React 19.2.6 は据え置き（peer 充足）。
- フォールバック: 動的レンダリング版（`connection()` 化）を `fix/charaname-dynamic-fallback` ブランチ（コミット `efc352a`）に保全。Vercel で動作確認済み。

### フォローアップ
- **修正入りの安定版（16.2.7 backport もしくは 16.3.0）が出たら canary から戻す**。issue #92145 / PR #93601 をウォッチ。
- canary を上げる際は `minimumReleaseAge`（3日）に合わせ公開3日以上の版にピンする。
- 安定版へ戻したら `fix/charaname-dynamic-fallback` ブランチは削除可。
- `compose.override.yaml`（server ポート公開リセット）は未追跡・ローカル専用のまま。

## 設計上の保留事項

- ~~**cookie domain**~~ → **確定**。same-origin リバースプロキシ方式を採用したため `AUTH_COOKIE_DOMAIN` は未設定（host-only cookie）。cross-subdomain 共有も `Set-Cookie` の Domain 書き換えも不要になった。
- **session 期限**: better-auth 既定 7 日。要件次第で延伸 / 短縮
- **rate limiting**: better-auth に組み込みあり。本番有効化時に検討
- **cookie cache**: getSession の往復コストが問題になったら better-auth の cookie cache 機能で軽減（DB lookup を一定時間スキップ）

## 用語・前提

- **better-auth バージョン**: 最新の安定版を使用（インストール時に確認）
- **DB driver**: 既存と同じ mysql2 + drizzle-orm
- **MySQL バージョン**: 8.4
- **JWT は使わない**: DB session 一本戦略。stateless 検証は今回採用しない
