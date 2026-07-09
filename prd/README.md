# PRD: Girl's Side Analysis

> **本ディレクトリはこのアプリの原典（source of truth）**。実装レビュー・仕様判断はここを基準に行う。
> 実装（`schema.ts` / `app.ts` / `charactersMaster.ts` など）は PRD に従う。
>
> ただし本 PRD は **2026-07-10 時点の実装から書き起こした**ものであり、
> **書き漏らし・誤読が残っている前提で読むこと**（実際、初版には誤りが数件あった）。
> 実装の方が正しいと判断したら、PRD を直す PR を出す。
> リポジトリルートの `README.md` は初期構想の記録であり、**仕様として参照しない**。

## 目的

ときめきメモリアル Girl's Side シリーズ（GS1〜GS4）のファンが、**自分の「推し」を順位付きで登録**し、
「**あるキャラを推す人が、他にどのキャラを推しているか**」という**組み合わせの傾向**を可視化する非公式ファンサイト。

単純な人気投票ではない。得られるのは「キャラ A を推す集団における、キャラ B の共起票数」であり、
**推しの組み合わせ**そのものが観測対象である。投票は日単位で履歴として蓄積されるため、**推しの変遷**も追える。

## スコープ

- **稼働中（現行）**: X(Twitter) ログイン → 推しの順位付き登録 → 組み合わせ集計の閲覧（全キャラ / キャラ別 / 30日推移）。
  投票は日単位で `Votes` に蓄積され、夜間 cron が過去日の pair 集計 snapshot（`DailyOshiCount`）を生成する。
- **当面の軸（2026-07-10 決定）**: 機能追加より先に、PRD と実装の乖離・既知の不備を潰す。
  CI（Biome + typecheck + 統合テスト）の新設、推し 0 人で 500 になる実バグの修正、投票入力の検証、
  役目を終えた snapshot テストの作り替え。→ [09-roadmap.md](./09-roadmap.md) §2。
- **将来案**: 同順位（「1 位が 2 人」）を入力できる UI、キャラ属性による傾向分析、
  3 人以上の組み合わせ（higher-order）分析、GS5 対応。→ [09](./09-roadmap.md) §3。

## アーキ概観

- pnpm monorepo。`next/`（Next.js フロント）と `server-ts/`（Hono API + node-cron）の 2 パッケージ。**別オリジンにデプロイされる**。
- MySQL 8.4 / Drizzle ORM 1.0 RC / Hono RPC（型を跨いで共有）/ better-auth（X OAuth のみ）。
- `server-rs/`（axum + sea-orm）は **pnpm workspace にも compose にも含まれない別実装**。稼働系ではない（[02](./02-architecture.md) §7）。
- 設計の柱: **「履歴（`Votes`）／現在状態（`LatestVotes`）／過去日集計（`DailyOshiCount`）」の 3 テーブル分離**。
  read 中心のワークロードに対し、毎 read で「最新投票」を再計算しない（[03](./03-data-model.md) §2）。

```
     [ ブラウザ ]
          │  投票は Server Action、閲覧は Server Component から
          ▼
   next (App Router / ISR) ──Hono RPC(Bearer API_KEY + cookie 転送)──> server-ts (Hono)
          │                                                                │
   revalidatePath                                                     Drizzle
   （on-demand ISR）                                                       ▼
                                                                    MySQL 8.4
                                                                         ▲
                                                     node-cron 00:01 JST │ DailyOshiCount 生成
```

## 文書索引

| 文書 | 内容 |
|---|---|
| [01-domain.md](./01-domain.md) | ドメイン事実（GS シリーズ / キャラ / 推し・順位・組み合わせ / プレイ状態 / 日の定義） |
| [02-architecture.md](./02-architecture.md) | 技術スタック / monorepo / 開発環境 / 依存ポリシー / デプロイ |
| [03-data-model.md](./03-data-model.md) | DB スキーマ / 3 テーブル設計 / インデックス / 日付と TZ / マイグレーション運用 |
| [04-voting.md](./04-voting.md) | 投票の入力仕様・書き込み規則・差分判定・認可 |
| [05-analysis.md](./05-analysis.md) | pair 集計の定義 / 夜間 cron / 時系列 / 決定性ルール |
| [06-auth-and-privacy.md](./06-auth-and-privacy.md) | better-auth / X OAuth / owner 境界 / PII 方針 |
| [07-api.md](./07-api.md) | API 契約（エンドポイント・認証レイヤ・RPC 型共有） |
| [08-frontend.md](./08-frontend.md) | ページ / ISR とキャッシュ / UI コンポーネント / SEO・a11y |
| [09-roadmap.md](./09-roadmap.md) | 着手する不備 / 次の機能追加 / 将来案 / 決着済みの論点 |
| [appendix-characters.md](./appendix-characters.md) | 付録 A: キャラクター一覧（**名簿の原典**）と変更手順 |

## この PRD の使い方（レビュー時）

- **PRD が原典である。** 実装が PRD と食い違う場合、PRD が正しい。
  ただし本 PRD は既存実装から書き起こしたため、**書き漏らし・誤読が残っている前提で読むこと**。
  実装の方が正しいと判断したら、PRD を直す PR を出す（実装を黙って正とみなさない）。
- 仕様変更を伴う PR は、**該当章の更新を同じ PR に含める**。
- 「未確認」「既知の不備」と明記された箇所は、仕様の欠落ではなく**意図的に未決**である。指摘は歓迎するが「バグ」として扱わない。
- 本リポジトリは **public** である。本番環境の具体情報（事業者名・ドメイン・接続先・シークレット・
  運用手順の詳細）を PRD に書かない（[02](./02-architecture.md) §6）。
