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

## 2. 着手する（当面の軸）

**方針（2026-07-10 決定）**: 機能追加より先に、PRD と実装の乖離・既知の不備を潰す。

### 2.1 高

| # | 項目 | 決定した方針 | 参照 |
|---|---|---|---|
| **A** | **推し 0 人で 500** | 前回 1 人以上いた人が推しを全消しして投票すると、drizzle の `values([])` が例外を投げて **500**（実バグ）。**0 件は投票として拒否する**: server は zod `.min(1)` で 400、UI は 0 件時に送信ボタンを無効化する。「推しをやめたい」需要は §2.4 の削除対応で受ける | [04](./04-voting.md) §4 |
| **B** | **CI が無い** | **Biome + typecheck + test の 3 点セット**を GitHub Actions で回す。詳細は §2.5 | [02](./02-architecture.md) §6.1 |

### 2.2 中

| # | 項目 | 決定した方針 | 参照 |
|---|---|---|---|
| **C** | 投票入力の検証不足 | `POST /votes/:id` に **1 件以上・`characterName` の重複なし・`level` は非負整数（0〜255）** を課す。**`level` の連番性は検証しない**（同順位を将来許すため。§4） | [04](./04-voting.md) §4 |
| **D** | `UserStates` の series ハードコード | `if (gs1State && ... && gs4State)` の**サイレントスキップを廃止**し、**送られてきた series だけを upsert** する部分更新にする。series の妥当性は `Characters` の DISTINCT series で検証し、不明な値は 400。GS5 は 付録 A に足すだけで動く | [04](./04-voting.md) §3 |
| **E** | テストが「使い終わった足場」 | 現行 12 件の snapshot は 3 テーブル移行の安全網であり、役目を終えた。**seed 直引きのテストと、本番から呼ばれない `getVotesRelatedToOshi` のテストを削除**し、**仕様を語るテストへ作り替える**。詳細は §2.5 | [05](./05-analysis.md) §7 |

### 2.3 低

| # | 項目 | 決定した方針 |
|---|---|---|
| F | `server-ts/src/lib/votes.ts` の `'use server'` | 削除する。Hono では無意味だが、`next/` 側の同名ファイルでは**禁忌**（[04](./04-voting.md) §5）なので、残すと将来混乱する |
| G | seed の `level` が 1 始まり | UI が送るのは 0 始まり。`addTestData.ts` を実際の入力に合わせる。E と同じ PR で |
| H | `UserStates.twitter_id` だけ varchar(20) | varchar(32) に揃える。drizzle マイグレーション 1 本。**本番 ALTER の権限確認**が要る（[03](./03-data-model.md) §5.1） |
| I | `/[charaName]` の `dynamic = 'force-static'` | 指定しないと dynamic rendering に落ちる原因を特定し、コメントを推測から確定事実にする |

### 2.4 やらないと決めたこと

- **退会・データ削除の UI は作らない**（2026-07-10 決定）。ファンサイトであり、積極的に退会を促す必要がない。
  ただし**本人から申し出があれば手動で消せるようにしておく**。対象テーブルと手順は [06](./06-auth-and-privacy.md) §4.1。
- **投票キーの `twitter_id` → `user.id` 移行は保留**。X 以外の認証プロバイダを足す判断が立ってから着手する
  （[03](./03-data-model.md) §6）。

### 2.5 B と E の具体（決定事項）

**CI**（`.github/workflows/ci.yml` を新設）

- **Biome を導入**する。設定は同一著者の別リポ（highscore-must-fall）の `biome.json` を流用
  （スペース 2 / 行幅 100 / シングルクォート / セミコロンは必要時のみ / `useSortedClasses`）。
  - `useSortedClasses` は安全。このリポの `!` は **Tailwind v4 の接尾辞 important**（`hover:bg-white!`）で、
    競合は **CSS の生成順**で起きる。class 属性内の並べ替えは important にも生成順にも影響しない。
- `typecheck` スクリプト（`tsc --noEmit`）を**両パッケージに新設**する（現在どこにも無い）。
  `next/package.json` の `"lint": "next lint"` は **Next 16 でコマンドが廃止済み**で動かない。置き換える。
- **PR / コミットの切り方**: ① `biome.json` + 依存追加 → ② `biome format --write` の**整形のみ**
  → ③ typecheck script + `ci.yml`。② の SHA を `.git-blame-ignore-revs` に登録して blame を汚さない。
- **CI の MySQL は GitHub Actions の `services: mysql:8.4`** で立て、`DB_HOST=127.0.0.1` で
  `server-ts` の vitest を直接動かす。`test/globalSetup.ts` は**無改造**で通る（root で `<DB>_test` を作る構造がそのまま活きる）。
  エラーメッセージの「server コンテナ内で実行してください」だけ直す。ルートの `pnpm test`（compose 経由）は残す。

**テストの作り替え**

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
- **GS5 対応**。`series` は `tinyint` で拡張でき、§2.2 D を直せば [付録 A](./appendix-characters.md) への追加だけで動くようになる。
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
- ✅ **推し 0 人は投票として認めない**（2026-07-10 決定。§2.1 A）。
  0 件を許すと `Votes` にその日の行が残らず、as-of 集計（[05](./05-analysis.md) §2）が
  **前回の投票日を拾って推しを復活させる**。番兵行は `character_name` の FK により置けない。
  0 件を正式サポートするなら「投票日ログ」テーブルの新設が要るが、需要がないため採らない。
