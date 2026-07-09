# 06. 認証とプライバシー

本アプリは**公開・マルチユーザー**である。投票の書き込みは本人だけ、集計の閲覧は誰でも、という非対称な境界を持つ。

---

## 1. 認証

- **better-auth** を採用（実装: [`server-ts/src/lib/auth.ts`](../server-ts/src/lib/auth.ts)）。
- **プロバイダは X (Twitter) OAuth のみ**。メール+パスワードは持たない（保管・リセット・総当たり対策の負担をゼロにする）。
  ファンの交流が X 上で起きているため、X アカウントが自然な同一性の担保になる。
- **セッションは DB session（cookie）一本**。JWT と DB session の併用はしない。
- better-auth が `user` / `session` / `account` / `verification` を管理する（[03](./03-data-model.md) §3.6）。

### 1.1 OAuth スコープ

`disableDefaultScope: true` で better-auth の既定（`offline.access`）を外し、**X の Developer Portal 側の設定と一致**させている。

| scope | 理由 |
|---|---|
| `users.read` | プロフィール取得 |
| `tweet.read` | **`/2/users/me` の呼び出しに必須**。外すと認証自体が通らない |
| `users.email` | 将来のメール通知のために意図的に残す。現在は使っていない |

- **勝手にツイートしない**。書き込み権限は要求していない。UI にもその旨を明示する。
- X から email が取れないことがあるため、`mapProfileToUser` で `${username ?? id}@twitter.local` を充てる
  （`user.email` が NOT NULL UNIQUE のため）。**このアドレスは実在しない**。メール送信を実装する際はここを踏まないこと。

### 1.2 cookie とオリジン

- cookie prefix は `gsa`。
- 本番はフロントと API が**別サブドメイン**で動くため、`AUTH_COOKIE_DOMAIN` を設定して
  親ドメインで cookie を共有する（`secure: true`, `sameSite: 'lax'`）。**未設定なら既定のまま**（ローカル）。
- `trustedOrigins` と `/api/auth/*` の CORS origin はどちらも **`BETTER_AUTH_URL`（= フロントの origin）**。
- ローカルでは `next.config.ts` の rewrites が `/api/auth/*` を API サーバへ転送し、**same-origin** に見せる
  （`ENABLE_AUTH_REWRITES=true` のとき）。本番は `NEXT_PUBLIC_AUTH_BASE_URL` を設定して cross-origin で直接叩く。

## 2. owner 境界

- **ユーザーデータの所有キーは `twitter_id`**（`user.twitter_id`。better-auth の `additionalFields`）。
  `account` 作成後フックで `providerId === 'twitter'` の `accountId` を `user.twitter_id` に書き戻す。
- `Votes` / `LatestVotes` / `UserStates` はすべて `twitter_id` を先頭に持つ。
- `user.id`（better-auth の安定 ID）ではなく `twitter_id` を使うのは**歴史的経緯**。
  `user.twitter_id` が UNIQUE なので整合するが、X 以外のプロバイダを足すと破綻する（[09](./09-roadmap.md) §2）。

## 3. 認可の多層防御

`server-ts` は 3 層でリクエストを絞る（実装: [`server-ts/src/app.ts`](../server-ts/src/app.ts)。詳細は [07](./07-api.md) §3）。

| 層 | 対象 | 内容 |
|---|---|---|
| 1. API キー | `/api/auth/*` 以外の全パス | `Authorization: Bearer <API_KEY>`。**定数時間比較**（`timingSafeEqual`） |
| 2. 本人確認 | `/votes/:id`, `/users/:id` | cookie から better-auth セッションを復元し、`session.user.twitterId === :id` を要求。不一致は **403** |
| 3. 管理者キー | `/admin/*` | `X-Admin-Key: <ADMIN_API_KEY>`（設定時のみ。未設定なら警告して通過） |

- 1 は**サービス間認証**であり、ユーザー認証ではない。`API_KEY` は Next のサーバ側だけが持つ（ブラウザに出さない）。
- 2 があるので、**Next 層に認可漏れがあっても他人のデータは読み書きできない**。
- 3 は最小権限のための追加レイヤ。`ADMIN_API_KEY` 未設定時に通過するのは後方互換のためで、**本番では設定する**。

## 4. 公開範囲とプライバシー

| データ | 公開範囲 |
|---|---|
| pair 集計（キャラ × キャラ × 票数） | **公開**（未ログインでも閲覧可） |
| 30 日の時系列 | 公開 |
| 個人の推し（誰が誰を推しているか） | **本人のみ**（`/votes/:id` は `requireOwnId`） |
| 個人のプレイ状態 | 本人のみ |
| `twitter_id` / email / X の表示名 | **DB 内のみ**。API のどの公開エンドポイントからも出ない |

- 投票は**匿名で集計される**。ユーザーが自分で X にシェアしない限り、誰が何に投票したかは外から見えない。
  この方針は `/profile` の未ログイン画面でユーザーに明示している。
- `/profile` は `robots.txt` で `Disallow`。
- **`twitter_id` は準識別子である**。ログ・エラーメッセージ・スクリーンショット・PR 本文に貼らない。
- **DB ダンプをコミットしない**（`.gitignore` で `*.sql` / `*.sql.gz` を除外済み）。本リポジトリは public である。

### 4.1 退会・データ削除

✅ **決定（2026-07-10）**: **退会 UI は作らない**。ファンサイトであり、積極的に退会を促す必要がない。
ただし**本人から申し出があれば手動で消せる**ようにしておく。

削除対象（`Votes` / `LatestVotes` / `UserStates` は `twitter_id` キーで、`user` テーブルへの FK を持たない。
**`user` 行を消しても投票データは残る**ので、両方を消す必要がある）:

| キー | テーブル |
|---|---|
| `twitter_id` | `Votes` / `LatestVotes` / `UserStates` |
| `user.id` | `session` / `account` / `user`（`session`・`account` は `user` への FK が `ON DELETE CASCADE`） |

- `DailyOshiCount` は**個人の行を持たない集計値**なので、削除後も過去日の数字には寄与が残る。
  個人は特定できない。厳密に消すなら `pnpm db:backfill` で該当期間を再集計する。
- 本番 DB への接続手順・認証情報は**公開リポジトリに書かない**。

### 4.2 その他の未実装

- レート制限・濫用対策は無い（API キーが事実上の入場制限になっている）。

## 5. 認証エラーの扱い

- OAuth 失敗時は `/profile?error=...` に戻り、「直前の X(Twitter) 認証が上手くいかなかった様です…」を表示する。
- ログイン後の遷移先は `callbackURL: '/profile'` 固定。
