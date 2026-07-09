# 07. API 契約

`server-ts` が公開する HTTP API の仕様。実装の正典は [`server-ts/src/app.ts`](../server-ts/src/app.ts)。
認可の考え方は [06](./06-auth-and-privacy.md) §3、呼び出し側は [08](./08-frontend.md) §3。

---

## 1. 前提

- 単一の Hono インスタンス。ルートは `app.ts` にすべて定義する（ファイル分割していない）。
- 入力検証は `@hono/zod-validator` + **`zod/v4`**（`import { z } from 'zod/v4'`）。
- コンテナ内は **3000 番**で listen する（開発時にホストへ公開されるのは 4000 番）。

## 2. エンドポイント一覧

| メソッド | パス | 認証 | 入力 | 出力 |
|---|---|---|---|---|
| GET | `/characters` | API キー | — | `{series, sort, name, reading}[]`（公式順） |
| GET | `/analysis` | API キー | — | `{ [キャラ名]: { [関連キャラ名]: 票数 } }`（**全キャラ・重い**） |
| GET | `/analysis/:charaName` | API キー | param | `{ [関連キャラ名]: 票数 }` |
| GET | `/timeline/:charaName` | API キー | param | `DataSet[]`（30 日分。[05](./05-analysis.md) §3） |
| GET | `/meta/users/status-types` | API キー | — | `{state, sort}[]`（sort 昇順） |
| GET | `/users/:id` | API キー + **本人** | param | `{series, state}[]`（最新のプレイ状態） |
| POST | `/users/:id` | API キー + **本人** | `{series: number, state: string}[]` | 空ボディ 200 |
| GET | `/votes/:id` | API キー + **本人** | param | `{characterName, level}[]`（現在の推し） |
| POST | `/votes/:id` | API キー + **本人** | `{characterName: string, level: number}[]` | `{updatedCharaNames: string[]}` |
| POST | `/admin/aggregate-day` | API キー + **管理者キー** | query `date?=YYYY-MM-DD` | `{ok: true, snapshotDate}` |
| GET/POST | `/api/auth/*` | **認証対象外** | better-auth 準拠 | better-auth の応答 |

- `:id` は **`twitter_id`**（better-auth の `user.id` ではない。[06](./06-auth-and-privacy.md) §2）。
- 例外は握って `console.error` し、**本文なしの 500** を返す（エラー詳細をクライアントに漏らさない）。
- `GET /analysis` は 62 キャラ分の pair 集計を並列に投げる。**ISR 経由でしか呼ばれない前提**（[03](./03-data-model.md) §7）。

### 2.1 `POST /votes/:id` の検証（2026-07-10 決定）

現状の zod は `z.array(z.object({ characterName: z.string(), level: z.number() }))` のみ。以下を課す:

- **1 件以上**（`.min(1)`）。0 件は 400（[04](./04-voting.md) §4.1）。**現状は 500 になる実バグ**。
- `characterName` の**重複を拒否**（現状は `Votes` の PK 衝突で 500）。
- `level` は**非負整数・0〜255**。**連番性は要求しない**（同順位を許すため）。

`POST /users/:id` は **送られた series だけを upsert** する（4 件必須をやめる）。
未知の series は 400（[04](./04-voting.md) §3.1）。

## 3. ミドルウェアの適用順

`app.ts` の記述順がそのまま適用順になる。**順序に意味がある**。

1. `cors()` — `/api/auth/*` のみ。`origin: BETTER_AUTH_URL`, `credentials: true`。
2. better-auth ハンドラ — `/api/auth/*` の GET/POST。**cookie で自己完結するので API キーの対象外**。
3. **API キー認証** — `'*'`。ただし `/api/auth/` で始まるパスは素通り。
   - ヘッダ無し → **401** / `Bearer <token>` の形でない → **400** / 不一致 → **401**。
   - 比較は `timingSafeEqual`（長さが違えば即 false。鍵長の漏洩は実害なしと判断）。
4. **管理者キー** — `/admin/*`。`ADMIN_API_KEY` 未設定なら警告ログのみで通過（後方互換）。
5. **`requireOwnId`** — `/votes/:id` と `/users/:id`。セッションの `twitterId` と `:id` の不一致は **403**。

## 4. RPC 型の共有

- `app.ts` の末尾で `export type AppType = typeof route` と `export { hc } from 'hono/client'`。
- Next からは必ず **`@daiius/girls-side-analysis-server-ts/client`**（= `src/client.ts`）を import する。
  こちらは `AppType` と `hc` だけを再エクスポートする**副作用のないエントリ**で、
  better-auth の初期化や `process.env` の必須チェックを引き込まない（[02](./02-architecture.md) §3.1）。
- **API の形を変えると Next 側が型エラーになる**。これが唯一の結線検査であり、契約テストの代わりを務めている。
  エンドポイントの追加・変更時は `next` の typecheck を必ず通すこと。

## 5. 環境変数（server-ts）

| 変数 | 必須 | 用途 |
|---|---|---|
| `API_KEY` | ✅（未定義なら起動時 throw） | サービス間認証の Bearer トークン |
| `ADMIN_API_KEY` | — | `/admin/*` の `X-Admin-Key`。未設定だと警告して通過 |
| `BETTER_AUTH_URL` | ✅（throw） | フロントの origin。CORS / trustedOrigins / better-auth の baseURL |
| `BETTER_AUTH_SECRET` | ✅ | better-auth のシークレット |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | ✅ | X OAuth |
| `AUTH_COOKIE_DOMAIN` | — | 設定時のみ cookie を親ドメイン共有（本番） |
| `DB_HOST` / `DB_PORT` | `DB_HOST` は実質必須 | MySQL 接続（port 既定 3306） |
| `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | ✅ | MySQL 接続 |
| `MYSQL_ROOT_PASSWORD` | テスト時 | `<DB>_test` の作成・破棄 |
| `TEST_TWITTER_ID` | — | seed のユーザー ID（テストでは `testID2` に上書きされる） |
| `TZ` | 実質必須 | `Asia/Tokyo`（compose / 本番コンテナで設定。luxon と cron でも二重に明示） |

`.env*` はコミットしない。`server-ts/.env.example` は**存在しない**（`.env.development` が事実上の雛形）。
