# 08. フロントエンド

`next/`（Next.js 16 App Router / React 19）の仕様。投票の意味論は [04](./04-voting.md)、
表示するデータの定義は [05](./05-analysis.md) を参照。

---

## 1. ページ

| パス | ファイル | 内容 |
|---|---|---|
| `/` | `src/app/page.tsx` | 全キャラの pair 集計を **10 秒ごとに 1 キャラずつ自動で順送り**表示 |
| `/[charaName]` | `src/app/[charaName]/page.tsx` | キャラ別の pair 集計（横棒）＋ 30 日の折れ線 |
| `/profile` | `src/app/profile/page.tsx` | ログイン / 投票フォーム |
| `/robots.txt` | `src/app/robots.ts` | `/profile` を Disallow |
| `/sitemap.xml` | `src/app/sitemap.ts` | トップ + 全キャラページ |

- ルートレイアウトは 1 つ（`layout.tsx`）。`<html lang="ja">` / `SettingsProvider` / `Header` / `Footer`。
- **`/[charaName]` は生の日本語 URL**（例 `/葉月珪`）で運用する。§5 参照。
- 存在しないキャラ名は `getCharacters()` と突き合わせて `notFound()`。

## 2. キャッシュとレンダリング（ここが最も壊れやすい）

| 設定 | 場所 | 意図 |
|---|---|---|
| `revalidate = 86400` | `/`, `/[charaName]`, `sitemap.ts` | 時間による ISR は 1 日 1 回の保険。主経路は on-demand |
| `dynamic = 'force-static'` | `/[charaName]` | 指定しないと dynamic rendering に落ちる（**原因未特定**） |
| `generateStaticParams` | **コメントアウトで無効化** | 全 62 ページのビルド時生成は DB 負荷が高く、`dynamicParams = false` と `revalidatePath` の組み合わせが破綻したため |
| `revalidatePath` | `next/src/lib/votes.ts` | **on-demand ISR の主経路**（[04](./04-voting.md) §6） |
| cache tag（`revalidateTag` / `unstable_cache`） | **未使用** | fetch の `next: { revalidate }` だけで制御する |

- `revalidatePath` に渡すパスは **`encodeURIComponent` 必須**。日本語ルートに生の文字列を渡しても一致しない。
- ⚠️ 非 ASCII のルートパスは Next のキャッシュ／revalidate 周りで挙動が素直でない。
  この領域を触る PR は、**実際に投票して該当ページが更新されることを確認**すること（型とテストでは守れない）。
- ✅ **revalidate の対象は過不足ない**（2026-07-10 検証）。`updatedCharaNames` は旧 set と新 set の和 `S ∪ T` であり、
  票数が変化しうる pair の両端を必ず含む。証明は [04](./04-voting.md) §2.3。
  `next/src/lib/votes.ts` に残る「ロジックミス、実際には…全キャラ」というコメントの方が誤りなので、修正する。

## 3. サーバとの通信

実装: [`next/src/lib/apiClient.ts`](../next/src/lib/apiClient.ts)。Hono RPC クライアント `hc<AppType>` を 2 種類作る。

| クライアント | 付与するもの | 用途 |
|---|---|---|
| `client(options?)` | `Authorization: Bearer ${API_KEY}` | **公開データ**（characters / analysis / timeline / status-types） |
| `authedClient(options?)` | 上記 + **ブラウザの cookie を転送** | **本人データ**（`/votes/:id`, `/users/:id`） |

- `authedClient` は `next/headers` の cookie を読むため**動的レンダリングになる**。
  Server Action またはログイン済みページからのみ使う。
- `options` は fetch の `next` オプション（`{ revalidate }` 等）にそのまま渡る。
  `getCharacters()` は `revalidate: 86400`。
- **`API_KEY` はサーバ側だけが持つ**。クライアントコンポーネントから API サーバを直接叩かない
  （例外は better-auth の `/api/auth/*` で、これは cookie 認証）。

### 3.1 Server Actions

- **公開ミューテーションは [`src/actions/voteActions.ts`](../next/src/actions/voteActions.ts) の `vote()` だけ**。
- `next/src/lib/votes.ts` と `users.ts` は `twitterID` を引数に取る内部ヘルパーであり、
  **`'use server'` を付けてはならない**（IDOR になる。[04](./04-voting.md) §5）。
- `src/app/**/route.ts`（route handler）は存在しない。`/api/auth/*` は `next.config.ts` の rewrites で API サーバへ転送する。

## 4. UI コンポーネント

世界観はゲーム風。`GSMessage`（メッセージウィンドウ）と `GSButton`（`variant: command / friend / system / date`）が基調。

| 領域 | 実装 | 要点 |
|---|---|---|
| 推しの順位付け | `VotingFormCharactersClient` + dnd-kit | 縦並びの D&D。**配列インデックスがそのまま `level`**。Mouse/Touch は `distance: 10` で誤爆防止、Keyboard センサーも有効。**縦 1 列であるため全順序を強制する**（同順位を入力できない。[01](./01-domain.md) §2.1） |
| キャラ選択 | `CharacterPickerDialog`（共通シェル） | 名前・**よみがな**検索、シリーズ絞り込みチップ、開いた時に選択中キャラへ自動スクロール。セルの挙動は `renderCell` で呼び出し側が決める |
| ↳ 分析ページへ遷移 | `TopCharacterPickerDialog` | セルは `<Link>`（本物の `<a href>`）。中クリック・履歴・a11y に強い |
| ↳ 推しの追加 | `AddCharacterDialog` | セルは `<button aria-pressed>`。トグルしてもダイアログは閉じない |
| 時系列グラフ | `LineChartClient` + chart.js | `chart.js/auto` を使わず**必要モジュールのみ register**（バンドル削減）。`hitRadius: 16` でタッチ配慮 |
| 横棒グラフ | `AnimatedVoteBar` | `maxCount` で正規化し、マウント後に幅をアニメーション |

### 4.1 シリーズ色の一元化

**`src/components/characterCellStyle.ts` の `seriesTheme` テーブルが唯一の定義元**。

| シリーズ | 色 |
|---|---|
| GS1 | green |
| GS2 | sky |
| GS3 | pink |
| GS4 | orange |

- Tailwind のクラス検出のため**完全リテラル**で書く（文字列連結でクラス名を組み立てない）。
- シリーズの追加・色変更は**このテーブルだけを直す**。ヘッダーのハート 4 色もこれに対応する。
- 「・」を含む複合名の折り返し・フォントサイズ・`col-span-2` の判定もここに集約する。

### 4.2 スタイル

- **Tailwind CSS v4**（`@tailwindcss/postcss`）。設定は CSS ファーストで `globals.css` の `@theme` に集約し、
  `tailwind.config.ts` は実質空。
- **daisyUI は使っていない**。UI プリミティブは Headless UI + Heroicons + 自作 `Button` / `GSButton`。
- **ライトテーマ固定**（`bg-sky-100 text-black`）。ダークモード切替は未実装。

## 5. SEO / メタデータ

- **内部リンク・canonical・sitemap をすべて「生の日本語 URL」に統一する**。
  Google は UTF-8 の日本語 URL を正式にサポートしており、エンコード形と混在させると canonical 判定がブレる。
  **パーセントエンコードした URL をこれらに混ぜないこと**（`revalidatePath` だけは逆にエンコードが必要。§2）。
- `metadataBase` は `HOST_URL`。タイトルは `%s | Girl's Side Analysis` テンプレート。
- OGP 画像は**静的ロゴ PNG 固定**。`opengraph-image` / 動的 OG 画像 / Twitter カードは未実装。
- `robots.ts` は `/profile` を Disallow、`sitemap.xml` を告知。

## 6. アクセシビリティ

- ネイティブ要素を優先する（`Button` は `as` で `button` / `a` / `Link` を切り替え、フォーカスと押下はネイティブの擬似クラスに任せる）。
- `aria-current="page"`（表示中キャラ）/ `aria-pressed`（トグル）/ `role="group"` + `aria-label`（シリーズ絞り込み）/
  検索入力と閉じるボタンの `aria-label` / 装飾アイコンの `aria-hidden`。
- タッチ配慮: D&D の `activationConstraint.distance: 10`、グラフの `hitRadius: 16`、`touch-none`。
- 外部リンクには `rel="noopener noreferrer"`。

## 7. 環境変数（next）

| 変数 | 用途 |
|---|---|
| `HOST_URL` | 自身の公開 URL（`metadataBase` / OGP / sitemap / シェア文言） |
| `API_URL` | `server-ts` のベース URL |
| `API_KEY` | `server-ts` への Bearer トークン（**サーバ側のみ**） |
| `NEXT_PUBLIC_AUTH_BASE_URL` | better-auth クライアントの baseURL。ローカルは空（相対パス + rewrites） |
| `ENABLE_AUTH_REWRITES` | `'true'` で `/api/auth/*` の rewrite を有効化（ローカル用） |
| `DEBUG` | `debug` パッケージのフィルタ（名前空間 `girls-side-analysis`） |

> `next/.env.production` に DB 接続情報や `AUTH_TWITTER_*` が残っているが、**現行の next コードは参照していない**（旧構成の名残）。
> `next/.env.development` の `URSA_AUTH_*` も未使用。UrsaAuth への移行は**追わないと決定済み**（[09](./09-roadmap.md) §4）。
