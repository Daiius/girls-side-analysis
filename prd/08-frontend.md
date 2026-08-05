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
| （error boundary） | `src/app/error.tsx` | 例外時の安全網。日本語 + Header/Footer 維持（[04](./04-voting.md) §7） |

- ルートレイアウトは 1 つ（`layout.tsx`）。`<html lang="ja">` / `SettingsProvider` / `Header` / `Footer`。
- **`/[charaName]` は生の日本語 URL**（例 `/葉月珪`）で運用する。§5 参照。
- 存在しないキャラ名は `getCharacters()` と突き合わせて `notFound()`。

## 2. キャッシュとレンダリング（ここが最も壊れやすい）

| 設定 | 場所 | 意図 |
|---|---|---|
| `revalidate = 86400` | `/`, `/[charaName]`, `sitemap.ts` | 時間による ISR は 1 日 1 回の保険。主経路は on-demand |
| `dynamic = 'force-static'` | `/[charaName]` | 指定しないと dynamic rendering に落ちる（**原因未特定**） |
| `generateStaticParams` | **コメントアウトで無効化** | 全 61 ページのビルド時生成は DB 負荷が高く、`dynamicParams = false` と `revalidatePath` の組み合わせが破綻したため |
| `revalidatePath` | `next/src/lib/votes.ts` | **on-demand ISR の主経路**（[04](./04-voting.md) §6） |
| cache tag（`revalidateTag` / `unstable_cache`） | **未使用** | fetch の `next: { revalidate }` だけで制御する |

- `revalidatePath` に渡すパスは **`encodeURIComponent` 必須**。日本語ルートに生の文字列を渡しても一致しない。
- ⚠️ 非 ASCII のルートパスは Next のキャッシュ／revalidate 周りで挙動が素直でない。
  この領域を触る PR は、**実際に投票して該当ページが更新されることを確認**すること（型とテストでは守れない）。
- ✅ **revalidate の対象は過不足ない**（2026-07-10 検証）。`updatedCharaNames` は旧 set と新 set の和 `S ∪ T` であり、
  票数が変化しうる pair の両端を必ず含む。証明は [04](./04-voting.md) §2.3。
  `next/src/lib/votes.ts` に残る「ロジックミス、実際には…全キャラ」というコメントの方が誤りなので、修正する。

### 2.1 `<Link>` の prefetch

**キャラページへ向かうリンクを複数並べる箇所では `prefetch={false}` を付ける。これは既定ではなく明示が必要。**

- `/[charaName]` は `dynamic = 'force-static'` なので Next からは **static route** に見える。
  `prefetch` の既定（`"auto"` / `null`）では、リンクがビューポートに入った時点で
  **ページ全部（30 日 × 共起相手数の時系列データ込み）**が取得される。
- 1 ページの RSC ペイロードは共起相手数に比例する。共起相手が多いキャラで **転送 7 KB / 展開 57 KB** 程度。
  61 人分がそのままクライアントのルーターキャッシュに積まれる。
- Next のスケジューラは画面外に出たリンクの prefetch を破棄するが、
  **読むために視界へ留まるリンク（ランキング行・一覧）は破棄されず全部取得される**。

| 箇所 | 方針 |
|---|---|
| 共起ランキング行（`TopAnalysisContent`） | **`prefetch={false}`** |
| キャラ選択モーダルのセル（`TopCharacterPickerDialog`） | **`prefetch={false}`** |
| トップの見出しの対象キャラ名（`TopAnalysisContent`、§4.4） | **`prefetch={false}`**。リンクは 1 本だが **`href` が 10 秒ごとに次のキャラへ変わる**（順送り）。既定のままだと**トップに留まっている時間に比例して**取得が積み上がり、61 人分（**転送 429 KB / 展開 3.4 MB**）へ漸近する |
| 単発のリンク（ヘッダーのロゴ、`/profile` への導線など） | 既定のままでよい |

⚠️ **数えるのは「同時に何本並ぶか」だけではない。「1 本のリンクが時間とともに何個の `href` を指すか」も数える。**
見出しの対象キャラ名は**ある瞬間には 1 本**なので「単発のリンク」に見えるが、実体は**順送りで 61 個の URL を辿る 1 本**であり、
並んだ 61 本と取得量は変わらない。**滞在時間が長いほど悪化する**ぶん、視界に留まるリンクより性質が悪い。

- `prefetch={false}` でも**クライアントサイドナビゲーションは効く**（フルリロードにはならない）。
  失われるのは「事前取得済みで瞬時に出る」ことだけ。
- 🚫 中間案の「hover 時だけ prefetch する」（`prefetch={active ? null : false}` + `onMouseEnter`）は
  **採用しない**。主な閲覧環境がスマートフォンで、touch では「タップ＝そのまま遷移」となり先読みにならない。
- ⚠️ **prefetch は production ビルドでしか走らない**。dev サーバでは再現しないので、
  この方針を変更する PR は `next build && next start` で確認すること。

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
| 共起ランキング | `TopAnalysisContent` | 見出しの対象キャラ名は**トップでのみ `<Link>`**（§4.4）。各行のキャラ名は**そのキャラの分析ページへの `<Link>`**（§4.3）。票数は `AnimatedVoteBar` |

### 4.3 共起ランキング行のリンク（回遊導線）

pair 集計は 61 ノードの重み付き無向グラフで、ランキングの 1 行が 1 本の辺にあたる
（[05](./05-analysis.md) §1）。**その辺を辿れるように、行のキャラ名を `/{そのキャラ}` へのリンクにする。**

- **相互リンクは定義から保証される**。`count(oshi, related)` は「両方推しているユーザー数」なので
  `count(A,B) == count(B,A)` であり、集計に `LIMIT` が無い。**A に B が出るなら必ず B にも A が出る**。
- **自己リンクは発生しない**。集計 SQL が対象キャラ自身を除外している（`ne(l1.characterName, oshi)`）ため、
  ランキングに現在地のキャラは現れない。`aria-current` の考慮は不要。
- リンク先は canonical / sitemap と同じ**生の日本語 URL**（§5）。
- 見た目は現状の文字組みを保ち、**hover / focus-visible でのみ下線**を出す。
  親が `flex-col` なので `self-end`（通常名）/ `self-start`（複合名）でリンクの箱を文字幅に縮める
  （既定の stretch のままだと下線が列幅いっぱいに伸びる）。
- まだ票が入っていないキャラへ直接飛べるので、**空データ時の表示が実際に踏まれる経路になる**。

### 4.4 見出しの対象キャラ名（「〇〇推しの人が同時に推すのは、」の〇〇）

`TopAnalysisContent` はトップ（`/`）とキャラページ（`/[charaName]`）で**共用**されており、
見出しの対象キャラが現在地かどうかがこの 2 つで違う。**現在地はリンクにしない**という規則
（`TopCharacterPickerDialog` のセルと同じ）で出し分ける。

| 呼び出し元 | 対象キャラ名 | 理由 |
|---|---|---|
| `/`（10 秒ごとの順送り） | **`/{そのキャラ}` への `<Link>`** | 順送りで出ている人は**誰の現在地でもない**。「今出ている人をもっと見たい」導線がここにしか無い |
| `/[charaName]` | **リンクにしない**（素の文字のまま） | その名前は**このページの主題そのもの**＝現在地。自分自身へのリンクは作らない |

- **`aria-current` は付けない。** あれは「**集合の中の今どれか**」を示す属性であり、
  61 セルが並ぶキャラ選択モーダル（§4）のような**集合がある場所**の規則である。
  見出しの名前は集合の一員ではない非対話なテキストなので、付けても読み上げに冗長な付言が増えるだけになる。
  §4.3 が「ランキングに現在地は現れないので `aria-current` の考慮は不要」と書いているのと**同じ結論**で、
  理由が違うだけ（ランキングは**現在地が現れないから**不要、見出しは**集合が無いから**不要）。
- 出し分けは `targetCharacterIsCurrent` prop（**既定 `true` = リンクにしない**）。効果は
  **リンクにするか否かだけ**。渡し忘れた時に困るのは自己リンクを作ってしまう側なので、安全側に倒してある。
  **明示的に渡すのはトップ（`src/app/page.tsx` → `TopAnalysis`）だけ**。
- **`prefetch={false}` を付ける**（§2.1）。画面に出ているリンクは 1 本だが、
  **`href` が 10 秒ごとに次のキャラへ変わる**ため、既定のままだと滞在時間に比例して
  61 人分のページを取りに行く。「単発のリンクだから既定でよい」は**この箇所には当てはまらない**。
- リンク先は canonical / sitemap と同じ**生の日本語 URL**（§5）。見た目は §4.3 と同じく
  **hover / focus-visible でのみ下線**。ただし親が `flex-row items-baseline` で、
  flex item の幅が内容幅に決まるため、§4.3 のような `self-end` / `self-start` は**要らない**。
- 名前を包む `<span>` の `key={targetCharacterName}`（順送りのたびに `animate-bounce-once` を
  再生させるためのもの）は**分岐の外側に置いたままにする**。`<Link>` 側へ動かすと
  キャラページで key が消える。

#### 4.4.1 順送りは hover / focus 中は止める（リンクを置いたことの帰結）

**ここに focusable な要素を置いた以上、10 秒ごとの入れ替えを止めずには使えない。**
リンクを置くまでこの領域に focusable が無かったので、入れ替えは無害だった。

| 症状 | 中身 |
|---|---|
| **キーボードで到達できない** | フォーカスしても最大 10 秒でリンクごと subtree が入れ替わり、焦点が `<body>` に落ちる。次の Tab は文書先頭からやり直しになる |
| **タップが吸われる / 別人へ飛ぶ** | tick が `pointerdown` と `click` の間に挟まると、押したアンカーが消えて click が不発になる。tick 直後なら**読んでいた名前と違うキャラのページ**へ行く |

- 実装は `TopAnalysis`。`onPointerEnter` / `onPointerLeave`（**hover とタップを 1 組で拾う**。
  touch では触れた時に pointerenter、離した時に pointerleave が飛ぶ）＋ `onFocus` / `onBlur`
  （React のこれらは focusin / focusout 相当でバブルするので、中のリンクのフォーカスが届く）。
- 一時停止中は `setInterval` を張らず、解除時に**タイマーを 0 から張り直す**。
  📌 **タップの競合が閉じるのはこの性質に依存している**。指を離してから click が届くまでの間に
  次の tick は来ない（10 秒空く）。「残り時間を覚えて再開する」実装に変えると**この保証が消える**。
- ⚠️ **一時停止だけでは直らない。`key` の見直しとセットで初めて成立する。**
  `TopAnalysis` の `key` が `Date.now()` だと**あらゆる再レンダリングで** `TopAnalysisContent` の
  subtree が作り直され、**一時停止のトグル自体がフォーカスを飛ばす**。
  `key={targetCharacterName}` にして「**対象キャラが変わった時だけ**作り直す」という本来の意図に戻す。
  `animate-bounce-once` と `AnimatedVoteBar` の再生条件は変わらない（どちらもキャラが変わった時に再生される）。
  - 同じ理由で `AnimatedVoteBar` の `key={Date.now()}` も外す。残すと**hover するたびに全部の横棒が
    0 から再アニメーション**する。identity は `<li>` の `key={characterName}` が決めるので key は要らない。

### 4.1 シリーズ色の一元化

**シリーズと色の対応は本表が原典**。実装はこれに従う。

| シリーズ | 色 |
|---|---|
| GS1 | green |
| GS2 | sky |
| GS3 | pink |
| GS4 | orange |

- 実装上、この対応を **Tailwind のクラス名に落とす場所は `src/components/characterCellStyle.ts` の
  `seriesTheme` ただ 1 箇所**である。ヘッダーのハート 4 色もこれに対応する。**色を変えるときはそこだけを直す**。
- Tailwind のクラス検出のため**完全リテラル**で書く（文字列連結でクラス名を組み立てない）。
- 「・」を含む複合名の折り返し・フォントサイズ・`col-span-2` の判定も同ファイルに集約する。

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
- **`description` は形容詞ではなく固有名詞と数字で書く**。想定質問（「ときメモ GS の推しキャラの
  組み合わせが分かるサイトは？」）への答えの形にする。
  - ⚠️ **子ページの `metadata` は親のフィールドを上書きする**。ルートの `description` を直しても
    `/[charaName]` には効かない（61 ページが取り残される）。
  - そのため文面は**ページ種別ごとに 1 箇所**で定義し、metadata と JSON-LD が同じものを使う:
    サイト全体は `SITE_DESCRIPTION`、キャラページは `characterPageDescription(name)`（ともに
    `next/src/lib/structuredData.ts`）。

### 5.1 JSON-LD（構造化データ）

実装は `next/src/lib/structuredData.ts` と `next/src/components/JsonLd.tsx`。
ねらいは検索のリッチリザルトではなく、**このサイトが何であるかを機械可読で断言する**こと
（本文を要約して答えを作る相手に、要約結果を先回りして置く）。

**`@id` 設計**（後付けは全ページ改修になるので先に決めた）:

| `@id` | 型 | 置き場所 |
|---|---|---|
| `${HOST_URL}/#website` | `WebSite` | ルート `layout.tsx`（全ページ） |
| `${HOST_URL}/#webapp` | `WebApplication` | 同上 |
| `${HOST_URL}/#author` | `Person` | 同上 |
| `${HOST_URL}/{キャラ名}#webpage` | `WebPage` | `/[charaName]` |
| `${HOST_URL}/{キャラ名}#ranking` | `ItemList` | 同上（`WebPage.mainEntity`） |

- **下層ページは実体を再定義せず `{ "@id": ... }` の参照だけを置く**。サイトを
  「バラバラのページ群」ではなく「ひとつの実体の発信」として読ませるため。
- **非営利のファンサイトなので `Organization` は立てない**（実体として存在しない）。
  `WebSite.publisher` も作者の `Person` を指す。
- **キャラページの `ItemList` がこのサイト固有で最も価値がある持ち札**。画面の `<ol>`（§6.1）と
  同じ集計結果・同じ順序を出す。票数は `ListItem` の数値プロパティに収まらないので、
  そのまま引用できる 1 文（「A と B の両方を推している人: N 人」）として `description` に持たせる。
- **票が 0 のキャラのページでは `ItemList` を出さない**（空のランキングを主題として宣言しない）。
- URL は canonical / sitemap / 内部リンクと同じ**生の日本語 URL**に揃える（§5）。
- ⚠️ `JSON.stringify` の結果は `<` を `\u003c` にエスケープしてから流し込む（`</script>` でのブレイクアウト防止）。
  データにキャラ名（DB 由来）が入るため、「自分たちのデータだから安全」に寄りかからない。
- 📌 実際に画面にある機能・公開されている発信先だけを書く（`featureList` / `sameAs` を推測で埋めない）。
- 見出し・landmark・リストといった**文書構造も検索／LLM からの読み取りに効く**が、
  規約としては a11y 側（§6.1）に集約する。同じ 1 つの実装が両方を満たすため、二箇所に書かない。

## 6. アクセシビリティ

### 6.1 文書構造（セマンティックマークアップ）

**見た目のためだけに `div` / `span` を使わない。** 意味のある要素を選び、CSS は後から当てる。
2026-08-04 の監査時点では `<h1>` が全ページで 0 個、landmark は `<main>` だけ、
共起ランキングは `div` の羅列だった。以下を規約とする。

- **landmark**: ヘッダは `<header>`、フッタは `<footer>`、本文は `<main>`（`layout.tsx`）。
  グローバルナビと呼べるリンク群は今のところ無いので `<nav>` は置かない。
- **見出しは 1 ページに `<h1>` を 1 つ**。ページの主題を名乗る。
  - `/[charaName]`: 「〇〇推しの人が同時に推すのは、」が**そのページの結論そのもの**なので、これを `<h1>` にする。
  - `/`: 見える範囲は吹き出し・投票導線・順送りで埋まっており、同じ内容の見出しを重ねると冗長なため
    **`sr-only` の `<h1>`** を置く。順送りブロックの見出しは `<h2>`（`TopAnalysisContent` の `headingLevel`）。
  - `/profile`: ログイン前は既存の「Twitterアカウント連携について：」を `<h1>` に。
    ログイン後は見出しに相当する文言が画面に無いので `sr-only` の `<h1>`。
  - `error.tsx`（ルートの error boundary）: これが出ている間、**子ページのツリーごと
    置き換わる**＝そのページの `<h1>` も消える。エラー画面だけ見出しの無い文書に
    ならないよう、メッセージ 1 行目（「ごめんなさい、問題が発生しました......」）を `<h1>` にする。
  - 📌 Tailwind の preflight が見出しの `font-size` / `font-weight` / `margin` を落とすので、
    `div` や `p` から見出し要素に変えても**見た目は変わらない**。
  - ⚠️ 見出しの中身は phrasing content に限る（`div` は `h1`〜`h6` の中に置けない）。
- **順位のある一覧は `<ol>`、1 件を `<li>`**。共起ランキングは 1 行が「キャラ名 + その票数」で
  1 つの項目なので、両方を同じ `<li>` に入れて**対応を構造で表す**
  （以前は名前と `AnimatedVoteBar` 内の票数が別々の `div` にあり、視覚的に隣接しているだけだった）。
  preflight が `list-style` と padding を落とすため見た目は変わらない。
- **`<canvas>` は既定でアクセシブルな名前も役割も持たない**。時系列グラフには
  `role='img'` + `aria-label`（何のグラフかを言葉で）を付ける。
  - 📌 これは支援技術向けの手当てであり、**グラフの中身が機械可読になるわけではない**。
    数値そのものを読ませたいなら別途データ表を持つことになる（未着手）。

### 6.2 部品レベル

- ネイティブ要素を優先する（`Button` は `as` で `button` / `a` / `Link` を切り替え、フォーカスと押下はネイティブの擬似クラスに任せる）。
- `aria-current="page"`（表示中キャラ）/ `aria-pressed`（トグル）/ `role="group"` + `aria-label`（シリーズ絞り込み）/
  検索入力と閉じるボタンの `aria-label` / 装飾アイコンの `aria-hidden`。
- **自動で入れ替わる領域に focusable を置くなら、hover / focus 中は入れ替えを止める**。
  止めないと、フォーカスした要素が数秒で DOM から消えて**焦点が `<body>` に落ちる**（キーボードで到達できない）。
  ポインタ操作でも `pointerdown` と `click` の間に入れ替わりが挟まると**押した対象が消える**。
  トップの順送り（10 秒ごと）がこれに当たる。実装と落とし穴は §4.4.1。
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

> 上表以外にも旧構成の名残の変数が env ファイルに残っているが、**現行の next コードは参照していない**。
> env ファイルはすべて gitignore 対象で、コミットしない（[02](./02-architecture.md) §5）。
> UrsaAuth への移行は**追わないと決定済み**（[09](./09-roadmap.md) §5）。
