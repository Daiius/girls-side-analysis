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

### Phase 1: 認証基盤（server-ts 側）

- [ ] **1.** server-ts に `better-auth` dep を追加
- [ ] **2.** `server-ts/src/db/schema.ts` に user/session/account/verification を追加（`@better-auth/cli generate` で雛形 → 既存スキーマに統合）
- [ ] **3.** `server-ts/src/lib/auth.ts` で `betterAuth({...})` instance を作成
  - drizzleAdapter + Twitter provider
  - `user.additionalFields: { twitterId: { type: 'string' } }`
  - `databaseHooks.user.create.after` で account から twitterId を user.twitterId に同期
  - JWT plugin は使わない
- [ ] **4.** `server-ts/src/app.ts` で `/api/auth/*` を `auth.handler` に mount。既存の Bearer apiKey middleware は `/api/auth/*` を除外
- [ ] **5.** `BETTER_AUTH_SECRET` を `.env.development` に追加、`server-ts/.env.development` の `TWITTER_CLIENT_ID/SECRET` も追加
- [ ] **6.** docker compose で database-preparation を再走 → drizzle-kit push でローカル DB にスキーマ反映

### Phase 2: next 側の差し替え

- [ ] **7.** next に `better-auth` dep を追加（auth-client 用）
- [ ] **8.** `next/next.config.ts` に `rewrites`: `/api/auth/*` → `${API_URL}/api/auth/*`
- [ ] **9.** `next/src/lib/auth-client.ts` で `createAuthClient` （`baseURL` は same-origin 想定で空 or `/`）
- [ ] **10.** `next/src/lib/auth-session.ts` でサーバ側ヘルパー `getSession()`：cookie を rewrites 経由で server-ts `/api/auth/get-session` に転送し session を取得
- [ ] **11.** `next/src/proxy.ts` を新設、`/profile` で `getSession()` を呼んで未認証なら `/` へ redirect。matcher: `['/profile']`
- [ ] **12.** `next/src/middleware.ts` を削除
- [ ] **13.** `auth()` 呼び出しを `getSession()` に置換（`profile/page.tsx`, `VotingForm.tsx`, `voteActions.ts`）
- [ ] **14.** `signIn('twitter')` を `authClient.signIn.social({ provider: 'twitter' })` に置換（`BeforeLoginProfile.tsx`）
- [ ] **15.** `signOut()` を `authClient.signOut()` に置換（`LogoutButton.tsx`, `authActions.ts`）

### Phase 3: 古いコード削除

- [ ] **16.** `next/src/auth.ts` を削除
- [ ] **17.** `next/src/app/api/auth/[...nextauth]/route.ts` を削除
- [ ] **18.** `next/package.json` から `next-auth` dep を削除
- [ ] **19.** 環境変数の差し替え（追加 / 削除）

### Phase 4: 動作確認

- [ ] **20.** docker compose で起動、playwright で /profile → ログインフロー（手動 X 認証はユーザー操作）
- [ ] **21.** 投票送信 → `Votes` に `twitter_id` 付きで insert されるか確認
- [ ] **22.** 既存 twitter_id を持つユーザーが過去の投票を引き継いで表示できるか確認
- [ ] **23.** revalidatePath が機能してトップ・キャラページが即更新されるか確認

### Phase 5: 本番マイグレーション

- [ ] **24.** 本番 DB 用の `migrate-auth.sql`（user/session/account/verification を CREATE）
- [ ] **25.** 本番環境変数を差し替え（Vercel 側は `BETTER_AUTH_URL` 等不要、server-ts 側に集約）
- [ ] **26.** デプロイ + 動作確認

## 設計上の保留事項

- **cookie domain**: rewrites で same-origin に見せる前提だが、Vercel の rewrites が `Set-Cookie` の Domain を正しく書き換えるか実装時に要確認
- **session 期限**: better-auth 既定 7 日。要件次第で延伸 / 短縮
- **rate limiting**: better-auth に組み込みあり。本番有効化時に検討
- **cookie cache**: getSession の往復コストが問題になったら better-auth の cookie cache 機能で軽減（DB lookup を一定時間スキップ）

## 用語・前提

- **better-auth バージョン**: 最新の安定版を使用（インストール時に確認）
- **DB driver**: 既存と同じ mysql2 + drizzle-orm
- **MySQL バージョン**: 8.4
- **JWT は使わない**: DB session 一本戦略。stateless 検証は今回採用しない
