# 09. ロードマップと未決事項

本章だけは**現状の記述ではなく意思**を含む。
§2・§5 の方針は **2026-07-10 の grill で確定**した（それ以前の「優先度は提案値」という但し書きは失効）。

---

## 1. 実装済み（稼働中）

- X(Twitter) OAuth ログイン（better-auth、DB session）→ [06](./06-auth-and-privacy.md)
- 推しの**順位付き**登録（D&D）とプレイ状態の申告 → [04](./04-voting.md)
- 日単位の投票履歴の蓄積（推しの変遷を保持）→ [01](./01-domain.md) §3
- pair 集計の閲覧: 全キャラ順送り（トップ）/ キャラ別（横棒 + 30 日折れ線）→ [05](./05-analysis.md)
- 3 テーブル設計（`Votes` / `LatestVotes` / `DailyOshiCount`）への移行と夜間 cron → [03](./03-data-model.md) §2
- キャラ検索（よみがな対応）付きの選択ダイアログ → [08](./08-frontend.md) §4
- drizzle-kit generate/migrate によるバージョン管理マイグレーション → [03](./03-data-model.md) §5
- **推し 0 人の投票を拒否**（旧 §2.1 A の実バグ。2026-08-04 解消）。server の zod `.min(1)` で 400 +
  UI の送信ボタン無効化 + 送信処理内チェックの 3 層 → [04](./04-voting.md) §4.1
- **Server Action 失敗時のエラー表示**（`error.tsx` + フォーム内 try/catch）→ [04](./04-voting.md) §7
- **CI（lint + typecheck + test の 3 点セット）**（旧 §2.1 B。2026-08-04 完了）。
  `.github/workflows/ci.yml` の 3 ジョブ → [02](./02-architecture.md) §6.2
- **投票 API の入力検証**（旧 §2.2 C。2026-08-05 完了）。形は zod、マスタ照合は DB 参照で
  すべて 400 にした。`server-ts/src/lib/validation.ts` → [04](./04-voting.md) §4.2
- **プレイ状態の部分申告と補完**（旧 §2.2 D。2026-08-05 完了）。**server 側の** series 番号の
  ハードコードとサイレントスキップを廃止 → [04](./04-voting.md) §3.1。
  ⚠️ **フロントエンドの固定列挙は残っている**（§2.2 J）

## 2. 着手する（当面の軸）

**方針（2026-07-10 決定）**: 機能追加より先に、PRD と実装の乖離・既知の不備を潰す。

### 2.1 高

なし（**B は 2026-08-04 に完了**。§1・[02](./02-architecture.md) §6.2）。

### 2.2 中

| # | 項目 | 決定した方針 | 参照 |
|---|---|---|---|
| **J** | フロントエンドの series 固定列挙 | **D の残り**（2026-08-05 にレビューで発覚）。server から series 番号は消えたが、`VotingFormUserStatesClient.tsx` の `gsSeries` と `voteActions.ts` の `formData.get('GS1')`〜`get('GS4')` が残っており、**GS5 は付録 A への追加だけでは申告できない**。series 一覧をデータとしてフォームへ渡し、`vote()` は FormData のキーから series を復元する | [04](./04-voting.md) §3.2 |
| ~~**C**~~ | ~~投票入力の検証不足~~ | ✅ **2026-08-05 完了**。形（件数・重複・値域）を zod、マスタ照合（キャラ名・series・state）を DB 参照で 400 にした。**`level` の連番性は検証しない**（同順位を将来許すため） | [04](./04-voting.md) §4.2 |
| ~~**D**~~ | ~~`UserStates` の series ハードコード~~ | ✅ **server 側は 2026-08-05 完了**（C と同じ PR）。サイレントスキップを廃止し、**部分申告を受け取って最新値で補完**する形にした。series の妥当性は `Characters` の DISTINCT series で検証。⚠️ **フロントエンドは J へ持ち越し** | [04](./04-voting.md) §3.1 |
| ~~**E**~~ | ~~テストが「使い終わった足場」~~ | ✅ **2026-08-04 完了**。snapshot を全廃し、仕様を語るテスト 15 件に作り替えた（G も同時に解消）。詳細は [05](./05-analysis.md) §7.1 | [05](./05-analysis.md) §7 |

### 2.3 低

| # | 項目 | 決定した方針 |
|---|---|---|
| ~~F~~ | ~~`server-ts/src/lib/votes.ts` の `'use server'`~~ | ✅ **2026-08-05 完了**（C・D と同じ PR）。Hono では無意味だが、`next/` 側の同名ファイルでは**禁忌**（[04](./04-voting.md) §5）なので削除した |
| ~~G~~ | ~~seed の `level` が 1 始まり~~ | ✅ **2026-08-04 完了**（E と同じ PR）。`addTestData.ts` を UI と同じ 0 始まりに揃えた |
| H | `UserStates.twitter_id` だけ varchar(20) | varchar(32) に揃える。drizzle マイグレーション 1 本。**本番 ALTER の権限確認**が要る（[03](./03-data-model.md) §5.1） |
| I | `/[charaName]` の `dynamic = 'force-static'` | 指定しないと dynamic rendering に落ちる原因を特定し、コメントを推測から確定事実にする |

### 2.4 やらないと決めたこと

- **退会・データ削除の UI は作らない**（2026-07-10 決定）。ファンサイトであり、積極的に退会を促す必要がない。
  ただし**本人から申し出があれば手動で消せるようにしておく**。対象テーブルと手順は [06](./06-auth-and-privacy.md) §4.1。
- **投票キーの `twitter_id` → `user.id` 移行は保留**。X 以外の認証プロバイダを足す判断が立ってから着手する
  （[03](./03-data-model.md) §6）。

### 2.5 B と E の具体（決定事項）

**CI**

- ✅ **済（2026-08-04）**: **Biome をリンター専用で導入**し、`.github/workflows/lint.yml` を新設。
  `next/package.json` の壊れた `"lint": "next lint"`（Next 16 で廃止済み）を除去。
  既存の指摘 63 件を解消済み。詳細と改訂理由は [02](./02-architecture.md) §6.1。
- ✅ **済（2026-08-04）**: `typecheck` スクリプトを両パッケージに新設し、CI で vitest も回すようにした。
  **`lint.yml` は `ci.yml` に統合**し、`lint` / `typecheck` / `test` の 3 ジョブ構成にした
  （着手時に決めると保留していた点。branch protection が未設定でチェック名の変更が安全なことを確認済み）。
  構成の詳細と根拠は [02](./02-architecture.md) §6.2。
  - `next` の typecheck は **`next typegen && tsc --noEmit`**。`next-env.d.ts` と `.next/types` が
    gitignore 対象で clone 直後に無いため、生成を伴わないと落ちる。
- 🚫 **改訂（2026-08-04）**: 当初は **Biome のフォーマッタも有効**にし、
  `biome format --write` の整形のみのコミットを 1 本切って
  その SHA を `.git-blame-ignore-revs` に登録する計画だった。
  実測の結果、現行スタイルに寄せた設定でも **63 / 63 ファイル・約 1,380 行**が書き換わる
  （`next` はセミコロンあり / `server-ts` はなしで流儀が違い、単一設定ではどちらかが必ず崩れる）ため、
  **フォーマッタは無効のまま**とした。
  - 📌 将来フォーマッタを入れる判断をするなら、上記の「整形のみコミット +
    `.git-blame-ignore-revs`」という手当ては依然有効。
  - 📌 `useSortedClasses` は安全という分析自体は変わらない。このリポの `!` は
    **Tailwind v4 の接尾辞 important**（`hover:bg-white!`）で、競合は **CSS の生成順**で起きる。
    class 属性内の並べ替えは important にも生成順にも影響しない。
- **CI の MySQL は GitHub Actions の `services: mysql:8.4`**（実施済み）。`DB_HOST=127.0.0.1` で
  `server-ts` の vitest を直接動かす。**compose ファイルは増やさない**。
  `test/globalSetup.ts` は**無改造**で通った（root で `<DB>_test` を作る構造がそのまま活きた）。
  エラーメッセージだけローカル / CI の両方を指すよう直した。ルートの `pnpm test`（compose 経由）は残す。

**テストの作り替え** — ✅ **2026-08-04 実施**。結果と、実施して分かったことは
[05](./05-analysis.md) §7.1 が正典。以下は着手前の計画（履歴として残す）。

- 現行 12 件のうち、**残すのは 2 件**（`getTimelineData` の合成・境界、`insertUserStatesIfUpdated` の同日再更新）。
  ただし snapshot ではなく**明示 assert**に書き直し、テスト名も**ドメインの言葉**にする
  （「PK 衝突しない」ではなく「同じ日に 2 回投票したら後の投票が採用される」）。
- **削除**するもの: `getVotesRelatedToOshi` × 3（**本番から呼ばれない**）、`getLatestVotes` × 3 /
  `getLatestUserState` × 2 / `getUserStatesMaster`（**seed した行がそのまま返るだけ** ＝ ORM の疎通確認）。
- **新規に書く**もの（いずれも PRD が「重要」と書きながら検証されていなかった）:
  1. **集計の決定性** — 同票のキャラが公式順（`series`, `sort`）で並ぶこと。
     現行テストは `byName()` でソートしてから snapshot を取るため、**`ORDER BY` を一切検証していない**（[05](./05-analysis.md) §4）。
  2. **as-of 集計の歯抜けなし** — 投票しない日が続いても最後の投票が反映されること。再実行の冪等性も（[05](./05-analysis.md) §2）。
  3. **`insertVotesIfUpdated` の書き込み** — 差分なしなら書かない / 同日再投票は置換 / `LatestVotes` 全置換 /
     `updatedCharaNames` に削除キャラが含まれる。
  4. **`getTimelineData`** — 今日 = `LatestVotes` / 過去 = `DailyOshiCount` の合成、30 日窓の境界、ゼロ埋め。
- **arrange はテスト内で組む**（seed 非依存）。各テストが専用 `twitterID` で投票を作り、集計して assert し、後始末する。
  期待値の根拠がテストの中で読み切れる形にする。`addTestData.ts` は**開発用 seed としてのみ**残す。
- これらは **実 MySQL に対する統合テスト**である。PRD でもそう呼ぶ。
  正しさが SQL（self-join / CTE / `ON DUPLICATE KEY UPDATE`）に宿っている以上、DB をモックしても何も守れない。
  実 DB は **SUT ではなく環境**である。

## 3. 次の機能追加（予定）

### 3.1 higher-order 分析（「A と B を推す人が推すのは」）

条件となる推しを 2 人以上に一般化した共起分析。**近々着手する**。定義は [05](./05-analysis.md) §1.3。

- **今日の分はスキーマ変更なしで実装できる**。`LatestVotes` を pair 形に潰さず per-user の推し set で持ったのは、
  まさにこのためである（[03](./03-data-model.md) §2）。
- ⚠️ **過去日は現行の `DailyOshiCount`（pair 形の snapshot）から復元できない**。
  「Votes の ad-hoc 集計 / n 人組 snapshot の新設 / 今日だけの機能と割り切る」のいずれかを**着手前に決める**。
- 時系列の見せ方（§4 の「時系列の期間と見せ方の再検討」）とも絡む。

## 4. 将来案（着手前）

- **同順位を許す入力 UI**（2026-07-10 に方針決定）。「1 位が 2 人」を認めたい。
  **DB と API はすでに表現できる**（`LatestVotes` の PK は `(twitter_id, character_name)` なので同一 `level` の重複が可能）。
  制約は dnd-kit の縦 1 列 UI が全順序を強制していることだけ。→ [01](./01-domain.md) §2.1。
- **時系列の期間と見せ方の再検討**。30 日という窓に強い根拠はなく、投票が一定化した現在ほとんど変化が見えない
  （[05](./05-analysis.md) §3）。「変化があった日だけ抽出する」等を検討。
- **キャラ属性による傾向分析**（先輩 / 先生 / 他校生 …）。公式定義が無く、認識違いが対立の火種になりうるため慎重に。
  属性を持たせるなら `Characters` の拡張ではなく別テーブル（1 キャラ N 属性）が素直。
- **プレイ状態を使った層別分析**（「プレイ済みの人の推し傾向」等）。データは既に貯まっている。
- **順位（`level`）を重みに使った集計**。現在は共起の有無しか見ていない。
- **GS5 対応**。`series` は `tinyint` で拡張でき、server 側は §2.2 D で対応済み。
  残るフロントエンドの固定列挙（§2.2 J）を直せば [付録 A](./appendix-characters.md) への追加だけで動くようになる。
- 「現実逃避ボタン」（見たくない共起結果を隠す）。初期構想のアイディア。

## 5. 決着済みの論点（旧「未確定」）

- ✅ **横断的な人気ランキングは出さない**（2026-07-10 決定）。
  公式の人気投票では得られない「**組み合わせ**」を見ることがこのアプリの存在理由（[README](./README.md) 目的）。
  総票数順を出すと「うちの推しは何位か」に関心が移り、主題がぼやける。
- ✅ **`server-rs` は凍結**（2026-07-10 決定）。維持はするが追随義務を負わない（[02](./02-architecture.md) §7）。
- ✅ **UrsaAuth (OIDC) への移行は追わない**（2026-07-10 決定）。
  そもそもの動機は「**X OAuth アプリを無料で 1 つしか作れない**」制約の回避だったが、
  **認証用途に限れば複数アプリを作れるようになり、動機自体が消えた**。UrsaAuth は独立した技術検証として続ける。
  - `feat/ursa-auth-migration` ブランチは参照用に残すが、唯一のコミット（2026-04-25）は
    「**NextAuth** → UrsaAuth」であり、その後 better-auth に移行済みなので**前提が失われている**。
    リベースでは再生できない。OIDC クライアント実装の参考としてのみ見る。
  - `next/.env.development` に残る `URSA_AUTH_*` は未使用（gitignore 済みのため実害なし）。
- ✅ **revalidate の「対象漏れ」は存在しなかった**（2026-07-10 検証）。
  `updatedCharaNames` は `S ∪ T`（旧 set と新 set の和）であり、票数が変化しうる pair の両端を必ず含む。
  証明は [04](./04-voting.md) §2.3。`next/src/lib/votes.ts` の「ロジックミス」コメントの方が誤りである。
- ✅ **推し 0 人は投票として認めない**（2026-07-10 決定 → 2026-08-04 実装。§1）。
  0 件を許すと `Votes` にその日の行が残らず、as-of 集計（[05](./05-analysis.md) §2）が
  **前回の投票日を拾って推しを復活させる**。番兵行は `character_name` の FK により置けない。
  0 件を正式サポートするなら「投票日ログ」テーブルの新設が要るが、需要がないため採らない。
