# 04. 投票

本章は「推しを登録する」フローの仕様を定める。UI の見た目は [08](./08-frontend.md)、
API の形は [07](./07-api.md)、認可の全体像は [06](./06-auth-and-privacy.md) を参照。

---

## 1. 投票とは何か

1 回の投票は、ログイン中ユーザーの以下 2 つを**同時に**送信する行為である。

1. **推しの並び**（0 人以上のキャラ名の順序付き配列）→ `Votes` / `LatestVotes`
2. **プレイ状態**（GS1〜GS4 の 4 件）→ `UserStates`

- ユーザーは**何度でも投票できる**（UI にも「何度でも投票できます！」と明記）。
- 送信のたびに**その日の記録が上書き**される。日を跨げば新しい日の行が増える（[01](./01-domain.md) §3）。
- 入口は **`/profile` のフォームだけ**。ここから Server Action [`vote()`](../next/src/actions/voteActions.ts) を呼ぶ。

## 2. 推しの書き込み規則（`insertVotesIfUpdated`）

実装: [`server-ts/src/lib/votes.ts`](../server-ts/src/lib/votes.ts)

### 2.1 差分判定（変更が無ければ何も書かない）

`LatestVotes` の現在値と受信データを比較し、**同一なら DB に触れず `{ updatedCharaNames: [] }` を返す**。

同一の条件は「**件数が等しく、かつ全要素が `(characterName, level)` の組として一致する**」こと。
順位だけが入れ替わった投票は**差分として扱われる**（`level` を比較に含めるため）。
これが「推しの順位の記録」を機能させている。

### 2.2 書き込み（1 トランザクション）

`votedDate = 今日（JST）` として:

| テーブル | 操作 |
|---|---|
| `Votes` | `(twitter_id, voted_date=今日)` を **DELETE** → 受信データを **INSERT** |
| `LatestVotes` | `(twitter_id)` の行を**全 DELETE** → 受信データを **INSERT** |

- 推しは増減するため、`UserStates` と違い upsert ではなく **DELETE+INSERT** で置き換える。
- per-user の書き込みなので InnoDB の行ロックで自然に直列化される。**アプリ側のロックは不要**。

### 2.3 戻り値 `updatedCharaNames`（なぜこれで十分か）

`{ 今回の全キャラ } ∪ { 前回いて今回いないキャラ }`、すなわち **旧 set `S` と新 set `T` の和集合 `S ∪ T`** を返す。
Next 側が **on-demand ISR の対象**として使う（§6）。

これは意図した設計であり、**「関連する全キャラを revalidate すべき」ではない**。証明:

pair `(X, Y)` の票数がこのユーザーの投票で変化するのは、`[X∈S ∧ Y∈S]` と `[X∈T ∧ Y∈T]` が異なるときに限る。

| X | Y | 変化 | 両端は `S ∪ T` に入るか |
|---|---|---|---|
| 残留（`S∩T`） | 削除（`S\T`） | する | ✓ |
| 削除 | 削除 | する | ✓ |
| 追加（`T\S`） | 残留 | する | ✓ |
| 追加 | 追加 | する | ✓ |
| 削除 | 追加 | **しない**（前も後も共起していない） | — |

変化しうる pair の**両端は必ず `S ∪ T` に含まれる**。このユーザーが推していないキャラのページは票数が変わらない。
よって `S ∪ T` のページ ＋ トップページを revalidate すれば過不足ない。

- ✅ **検証済み（2026-07-10）**: [`next/src/lib/votes.ts`](../next/src/lib/votes.ts) の
  「ロジックミス、実際には…全キャラ」というコメントは**誤り**。実装が正しい。コメントは修正する（[09](./09-roadmap.md) §4）。
- 実装は逆に**過剰**な側である。順位だけ入れ替えた投票（`{A,B}` → `{B,A}`）は差分と判定されるが、
  pair 集計は `level` を使わないので票数は変わらず、revalidate は無駄になる。害はキャッシュ破棄のみ。

## 3. プレイ状態の書き込み規則（`insertUserStatesIfUpdated`）

実装: [`server-ts/src/lib/users.ts`](../server-ts/src/lib/users.ts)

- 書き込むのは **「送られてきた series のうち、いずれかが最新状態と異なる」または
  「一度も申告の無い series が含まれる」とき**だけ。
  - ⚠️ **未申告を「変化」に数えること**。最新状態と比較する相手が存在しないため、
    最新状態の側から差分を取ると **GS5 のような新しい series の初回申告を書き漏らす**。
- **申告は部分的でよい**（§3.1）。送られてこなかった series は**最新値で補完**し、
  その日の行が常に全 series 揃うようにする。
- `recorded_date = 今日（JST）`。同日再申告は PK `(twitter_id, recorded_date, series)` に衝突するため、
  **`INSERT ... ON DUPLICATE KEY UPDATE status`** で吸収する（補完により行の集合が日をまたいでも
  変わらないので、`Votes` のような DELETE+INSERT にする理由がない）。
  - この同日再申告は**回帰テストで守られている**（`src/lib/users.test.ts`。日付列化で実際に踏んだバグ）。

### 3.1 部分申告と補完（2026-07-10 決定 → 2026-08-05 実装）

- ⚠️ **旧実装の欠陥**: GS1〜GS4 の 4 つすべてに値がある場合のみ書き込んでいた
  （`if (gs1State && gs2State && gs3State && gs4State)`。series 番号がハードコード）。
  **1 つでも欠けるとエラーにならず、黙って捨てられた**。GS5 が出れば破綻する状態だった。
- ✅ **決定**: **4 件揃っていることを要求しない**。送られてきた series を申告として受け取り、
  **送られてこなかった series は最新値で補完して、全 series セットとして upsert する**。
  series の妥当性は `Characters` の DISTINCT series から導出して検証し、不明な値は **400**（§4.2）。
  → [09](./09-roadmap.md) §2.2 D。
- ⚠️ **これで GS5 対応が完了したわけではない**。server 側から series 番号は消えたが、
  **フロントエンドにはまだ GS1〜GS4 の固定列挙が残っている**（§3.2）。
- 🔑 **なぜ「送られてきた分だけ書く」ではなく補完するのか**。
  `getLatestUserState` は**ユーザ単位の `MAX(recorded_date)` で最新日を 1 つ決め、その日の行を全部返す**。
  一部の series しか無い日を作ると、**書かなかった series が最新状態から消える**
  （昨日 GS1〜4 を申告したユーザーが今日 GS2 だけ送ると、最新状態が GS2 の 1 件になる）。
  補完すれば「1 日 = プレイ状態の完全なスナップショット」という現行の意味論が保たれ、
  読み出し側を触らずに済む。§1 が投票を「**全シリーズのプレイ状態を同時に申告する行為**」と
  定義している以上、全セットが意味の単位である。
  - 代案だった「読み出しを series ごとの as-of にする」は、履歴の意味を
    「series ごとの独立ログ」に作り変える変更になるため採らなかった。
    性能はどちらもユーザー 1 人の行範囲しか触らないので差が出ない（決め手は意味論）。
  - **一度も申告の無い series は補完元が無いので書かない**（未申告のまま返らない）。
    GS5 追加直後に旧クライアントが GS1〜4 だけ送るケースがこれに当たるが、
    「まだ申告していない」が正しい状態なので歯抜けではない。
- ⚠️ **補完があるため、この処理は read-modify-write である**。`Votes`（§2.2）は受信データだけで
  書けるので「per-user の行ロックで自然に直列化される」が、**こちらは読んだ値を書き戻すので
  それでは足りない**。同じユーザーから別々の series が並行して申告されると、後に書く側が
  「読んだ時点の古い値」で相手の変更を潰す（lost update）。
  そのため **`SELECT ... FOR UPDATE` でユーザーの行をまとめて押さえ、トランザクション内で
  read-modify-write を直列化**する。行が 1 つも無い初回申告でも、PK 先頭カラムの範囲に
  gap lock が掛かるので並行 INSERT を締め出せる。

### 3.2 残作業: フロントエンドの series 固定列挙

**server 側の series 番号は 2026-08-05 に消えたが、`next/` にはまだ残っている**。
そのため GS5 は [付録 A](./appendix-characters.md) への追加だけでは**申告できない**。

| 箇所 | 何が固定か |
|---|---|
| [`VotingFormUserStatesClient.tsx`](../next/src/components/VotingFormUserStatesClient.tsx) | `gsSeries` が `GS1`〜`GS4` の固定配列。フォームの `<Select>` はこれを `map` して生成する |
| [`voteActions.ts`](../next/src/actions/voteActions.ts) | `formData.get('GS1')`〜`get('GS4')` を読み、`series: 1`〜`4` の 4 件を組んで送る |

- **必要な変更**: series 一覧を `Characters` 由来のデータとしてフォームへ渡し、
  `vote()` は FormData のキー（`GS<n>`）から series を復元する。
  表示名は `GS{series}` で導出できるので、新しいマスタは要らない。
- ⚠️ **`next/` にはテストが無い**。投票フォームは公開ミューテーションの唯一の入口（§5）なので、
  着手するなら手動確認の手順を決めてから触る。
- → [09](./09-roadmap.md) §2.2 J。

## 4. 入力検証

### 4.1 推しは 1 人以上でなければならない（2026-07-10 決定）

**投票とは「1 人以上の推しを登録する行為」である。** 0 件は投票として認めない。

- ✅ **実装済み**（2026-08-04）。**4 層**で止める:
  1. server は zod `.min(1)` で **400**（`server-ts/src/app.ts` の `POST /votes/:id`）
  2. Server Action [`vote()`](../next/src/actions/voteActions.ts) の**先頭**で弾く（下記 ⚠️）
  3. UI は `favorites.length === 0` のとき**送信ボタンを無効化**する
  4. UI は送信処理内でも 0 件を弾き、`推しを 1 人以上選んでから投票してください！` を返す

> ⚠️ **検証は「あらゆる書き込みより前」に置くこと**（層 2 が本質）。
> `vote()` は `insertUserStatesIfUpdated` → `insertVotesIfUpdated` の順に呼ぶ（§6）。
> 推しの検証を server 側の `.min(1)` だけに頼ると、**プレイ状態は書き込まれた後で推しが 400 になり**、
> 「推しとプレイ状態を同時に送る 1 つの行為」（§1）が壊れる。巻き戻す仕組みは無い。
>
> ⚠️ **層 4 は「前回と同じ」判定より前に置くこと**。初投票のユーザーは `LatestVotes` が空なので、
> 0 人のまま送ると新旧どちらの set も空 → 差分なしと判定され、**0 件なのに「投票完了！」を返してしまう**。
>
> ⚠️ **層 3（ボタンの無効化）は検証境界ではない**。Server Action は公開エンドポイントであり、
> 直接呼び出せる。UI の状態は防御に数えない。
- かつては実バグだった: 前回 1 人以上いたユーザーが推しを全消しして投票すると、
  差分ありと判定 → `DELETE` 成功 → `tx.insert(votes).values([])` で drizzle が
  `values() must be called with at least one value` を投げ、**500** になっていた
  （トランザクションは rollback されデータは無事）。
  - 初回ユーザーの 0 件送信は差分判定が `isSame === true` となり書き込みをスキップするため、500 にならなかった。
- **なぜ 0 件を正式サポートしないのか**: 0 件を許すと `Votes` にその日の行が 1 行も残らない。
  すると as-of 集計（[05](./05-analysis.md) §2）の `MAX(voted_date) <= targetDate` が**前回の投票日を拾い、
  過去日の集計では推しが復活する**。`LatestVotes`（今日）からは消えるのに `DailyOshiCount`（昨日以前）には残る、
  という不整合になる。`character_name` に FK があるため「空投票」を表す番兵行も置けない。
  正しく直すには「投票日ログ」テーブルの新設が要るが、**ファンサイトに推し 0 人の需要はない**ため採らない。
- 「推しをやめたい / データを消したい」需要は [06](./06-auth-and-privacy.md) §4.1 の手動削除で受ける。

### 4.2 その他の検証（2026-07-10 決定 → 2026-08-05 実装）

実装: [`server-ts/src/lib/validation.ts`](../server-ts/src/lib/validation.ts)。

検証は 2 種類に分かれる。**形（型・値域・重複）は zod スキーマ**で書き、`zValidator` が 400 を返す。
**マスタに存在するか**は DB を引く必要があり zod では書けないので、ハンドラから
`findUnknown*` を呼んで 400 を返す。

| 項目 | 決定 | 層 |
|---|---|---|
| 推しが 0 件 | **拒否（400）**（§4.1） | zod |
| 同一 `characterName` の重複 | **拒否（400）**。無検証だと `Votes` の PK 衝突により 500 になる | zod |
| `level` の値域 | **非負整数・0〜255**（`tinyint unsigned`）を要求する | zod |
| `series` の値域 | 同上（`tinyint unsigned`） | zod |
| `level` の連番性 | **検証しない**。同順位（同じ `level` を持つ複数キャラ）を将来許すため（[01](./01-domain.md) §2.1） | — |
| 推しキャラ数の上限 | **設けない**。61 人全員を推してよい | — |
| 存在しないキャラ名 | **拒否（400）**。無検証だと `character_name` の FK 違反で 500 になる | DB（`Characters`） |
| 未知の `series` | **拒否（400）**。無検証だと FK が無いので黙って記録される | DB（`Characters` の DISTINCT） |
| `state` が `UserStatesMaster` に無い値 | **拒否（400）**。無検証だと `status` の FK 違反で 500 になる | DB（`UserStatesMaster`） |

正常系の UI からはこれらは起きない（UI が配列インデックスを `level` にし、選択済みキャラを再選択させない）。
**API を直接叩けば壊せる**が、API キーとセッションの両方を持つのは本人だけなので、
被害は自分のデータに限られる（[06](./06-auth-and-privacy.md) §4）。それでも 5xx ではなく 4xx で弾く。

> ⚠️ **マスタ照合は「あらゆる書き込みより前」には置けていない**。§4.1 の 4 層と違い、
> これらは `POST /votes/:id` `POST /users/:id` の各ハンドラ内でしか検証しないため、
> 存在しないキャラ名を含む投票は **`UserStates` が書かれた後で 400** になる（§6 の呼び出し順）。
> 正常系の UI では起こらず、被害は自分のデータに限られるため許容する。
> 完全に直すには 2 つの書き込みを 1 リクエストに束ねる必要があり、API 契約の変更になる。

> **`POST /users/:id` は空配列を 400 にしない**。「申告するものが無い」だけなので no-op として扱う。
> 推しの 0 件（§4.1）と違い、`Votes` の行が消えるような副作用が無い。

## 5. 認可（誰の投票として書かれるか）

- **`twitterID` はセッションからのみ導出する**。クライアントから受け取らない。
  `vote()` が `getSession()` → `session.user.twitterId` を取り、null なら throw する。
- Next 側の [`next/src/lib/votes.ts`](../next/src/lib/votes.ts) には **`'use server'` を付けてはならない**。
  `twitterID` を引数に取る内部ヘルパーが Server Action として公開され、
  任意の ID を指定できる認可バイパス（IDOR）になるため。**公開ミューテーションは `vote()` だけ**である。
  - ファイル冒頭にこの旨のコメントがある。レビューで `'use server'` の追加を見たら止めること。
- サーバ側も多層防御として `/votes/:id` `/users/:id` に `requireOwnId` ミドルウェアを敷き、
  cookie から復元したセッションの `twitterId` と `:id` の一致を要求する（[07](./07-api.md) §3）。

> 補足: [`server-ts/src/lib/votes.ts`](../server-ts/src/lib/votes.ts) の先頭にも Next から Hono へ移した際の
> `'use server'` が残骸として残っていたが、**2026-08-05 に削除した**（Hono ランタイムでは意味を持たない）。
> 上記の禁止事項は **`next/` 側のモジュール**に対するものである。

## 6. 投票後のキャッシュ無効化

1. `vote()` が `insertUserStatesIfUpdated` → `insertVotesIfUpdated` の順に呼ぶ。
2. `updatedCharaNames` の各キャラについて `revalidatePath('/' + encodeURIComponent(name))`。
   - **パーセントエンコードが必須**。ルートが日本語なので、生の日本語文字列を渡すと一致しない。
3. 1 件でも更新があればトップページ `revalidatePath('/')`。
4. クライアントは `router.refresh()` で自分のフォームを再取得する。

## 7. 投票が失敗したときの見せ方

**Server Action の例外をフォームの外に漏らさない**。`vote()` が投げると error boundary まで飛び、
入力中の推しの並びごと画面が差し替わってしまうため。

| 層 | 実装 | 役割 |
|---|---|---|
| フォーム内 | `VotingFormClient` の `useActionState` 内で `vote()` を **try/catch** | 日本語メッセージを `errorMessage` として返す。**選択中の推しは保たれ、そのまま再試行できる** |
| 安全網 | [`next/src/app/error.tsx`](../next/src/app/error.tsx) | 上記で捕まえきれない例外（server component の失敗など）を受ける |

- `error.tsx` は `layout.tsx` の下に置くため **Header / Footer は維持される**。
  再試行と「トップへ戻る」の導線を出し、`digest` は**エラー ID としてのみ**表示する。
- ⚠️ **再試行は `router.refresh()` と `reset()` を併用する**。`reset()` だけでは復旧しない。
  `reset()` は error boundary を再レンダリングするだけで、server component の結果は
  クライアントにキャッシュされた RSC ペイロードのままなので、原因が解消していても
  **同じ digest の例外を再生するだけ**になる（2026-08-04 に実測）。
- ⚠️ これが無いと Next の既定画面（英語の `A server error occurred` と ERROR 番号のみ、
  ヘッダー・フッターも消える）になる。**dev のオーバーレイとは全く別物**なので、
  この領域を触ったら `pnpm build && pnpm start` で確認すること。

詳細と Next の ISR 設定は [08](./08-frontend.md) §2。
