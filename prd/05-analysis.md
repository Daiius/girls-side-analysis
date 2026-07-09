# 05. 分析と集計

本章は「あるキャラを推す人が他に誰を推しているか」を求める集計の仕様を定める。
用語は [01](./01-domain.md) §2、テーブルは [03](./03-data-model.md)、API の形は [07](./07-api.md) を参照。

---

## 1. pair 集計の定義

`count(oshi, related)` = **「`oshi` を推すユーザーのうち、`related` も推しているユーザー数」**（`oshi ≠ related`）。

- 集計の単位は**ユーザー**であり、票の重みは全員 1。`level`（順位）は**重みに使わない**。
- 「その時点の推し set」の共起だけを見る。過去の推しは混ぜない。

### 1.1 今日の集計（read 時に計算）

`LatestVotes` の self-join（同一 `twitter_id` 内）で数える。実装 `getCurrentVotesRelatedToOshi`。

```sql
FROM LatestVotes l1 JOIN LatestVotes l2 USING (twitter_id)
WHERE l2.character_name = :oshi AND l1.character_name <> :oshi
GROUP BY l1.character_name
```

`Votes` の全走査も `MAX(voted_date)` サブクエリも不要。これが read パスの主役である。

### 1.2 過去日の集計（事前に snapshot）

`DailyOshiCount` を SELECT するだけ。生成は §2。

### 1.3 higher-order 集計（近々の機能。未実装）

「**A と B を推す人が、他に誰を推しているか**」のように、**条件となる推しを 2 人以上**に一般化した集計。
`count(oshi_set, related)` = 「`oshi_set` の全員を推すユーザーのうち、`related` も推している人数」。

- **今日の分は現行スキーマのまま計算できる**。`LatestVotes` を **per-user の推し set** として持ち、
  pair 形に潰していないのはこのためである（[03](./03-data-model.md) §2）。条件が n 人なら self-join を n 段重ねる。
- ⚠️ **過去日は現行スキーマでは復元できない**。`DailyOshiCount` は
  `(snapshot_date, oshi, related_chara, count)` という **pair 形に潰した snapshot** なので、
  「A と B を同時に推す人」という条件を後から再構成できない。選択肢は次のいずれか:
  1. 過去日は `Votes` の as-of 集計を都度実行する（遅いが正確。ad-hoc 分析向け）。
  2. n 人組の snapshot テーブルを別に作る（組み合わせ爆発に注意。61 人の 3 つ組は約 3.5 万通り）。
  3. higher-order は**「今日」だけの機能**と割り切る（時系列を出さない）。
- 実装前に、この選択と UI（条件キャラをどう選ばせるか）を決めること。→ [09](./09-roadmap.md) §3。

## 2. 過去日 snapshot の生成（as-of 集計）

実装: [`server-ts/src/lib/aggregate.ts`](../server-ts/src/lib/aggregate.ts) の `aggregateOshiCountForDate(db, targetDate)`。

```sql
WITH latest_per_user AS (
  SELECT v.twitter_id, v.character_name FROM Votes v
  WHERE v.voted_date = (
    SELECT MAX(v2.voted_date) FROM Votes v2
    WHERE v2.twitter_id = v.twitter_id AND v2.voted_date <= :targetDate
  )
)
SELECT :targetDate, l1.character_name, l2.character_name, COUNT(*)
FROM latest_per_user l1 JOIN latest_per_user l2 USING (twitter_id)
WHERE l1.character_name <> l2.character_name
GROUP BY l1.character_name, l2.character_name
```

- **as-of の意味**: 各ユーザーについて「`targetDate` 以前で最も新しい投票日」の推し set を採用する。
  何日も投票していないユーザーも最後の投票が生き続けるため、**時系列に歯抜けが生じない**。
- **`LatestVotes` を集計元にしない**理由: `LatestVotes` は「現在」しか持たないので過去日を再現できない。
  `Votes` を as-of で読むことで、**cron も backfill も同一関数**を使える。
- **冪等**: 同一トランザクション内で `snapshot_date = targetDate` を DELETE してから INSERT する。
  何度実行しても結果は同じ。**任意の過去日を後から正確に再計算できる**。

### 2.1 実行経路

| 経路 | 内容 |
|---|---|
| **夜間 cron** | `'1 0 * * *'`（**00:01 JST**、`timezone: 'Asia/Tokyo'`、`noOverlap: true`）で**昨日**を集計 |
| **手動 API** | `POST /admin/aggregate-day?date=YYYY-MM-DD`（省略時は昨日）。cron 失敗時のリカバリ |
| **backfill** | `pnpm db:backfill [days]`（既定 30 日。**今日は含めない**）。移行時・取りこぼし復旧用 |

- cron は in-process（`server-ts` のプロセス内）。**サーバが落ちていた日は自動で埋まらない**。
  失敗しても例外を握って `console.error` するだけで、プロセスは落とさない。手動 API で埋め直す。
- `noOverlap: true` により、前回実行が長引いても多重起動しない。

## 3. 時系列データ（`getTimelineData`）

キャラ別ページの折れ線グラフ用。**30 日窓**（`ndays = 30`、今日を含む）。

> **30 日という数字に強い根拠はない。** 当初は「推しの変化が見える最小限の長さ」を意図したが、
> 公開直後のピークを過ぎて投票が一定化した現在、30 日でもほとんど変化が現れない。
> **期間と見せ方（例: 変化があった日だけを抽出する）は再検討の対象である**。変更してよい。
>
> ⚠️ **2025 年 9〜12 月頃のデータが運用上の事故により欠落している。** 時系列を読むときは留意すること。

1. 過去日（窓の開始 〜 昨日）を `DailyOshiCount` から **1 クエリで一括取得**。
2. **今日の 1 日分だけ** `getCurrentVotesRelatedToOshi` で計算して補う。
3. 日ごとの配列に整形し、キャラごとの `{x: 日付ラベル, y: 票数}` 列を返す。

旧実装の「全 `Votes` 走査 × 30 回」を**軽い 2 クエリ**に置き換えている。
窓の境界（今日・30 日前）は**プロセス TZ ではなく JST 固定**で判定する。

## 4. 決定性のルール（重要）

同票のキャラが並んだとき、順序が実行ごとにブレると **グラフの色割り当てや凡例順が毎回変わる**。
これを防ぐため、**すべての集計クエリで同値時のタイブレークを公式順に固定**する。

| 対象 | ソート |
|---|---|
| pair ランキング | `count` 降順 → `characters.series` 昇順 → `characters.sort` 昇順 |
| 自分の投票一覧 | `level` 昇順 → `series` 昇順 → `sort` 昇順 |
| `DailyOshiCount` の読み出し | `snapshot_date` 昇順 → `count` 降順 → `related_chara` 昇順 |
| timeline の凡例順 | **窓内の合計票数**降順 → 公式順 |

- 公式順で並べるために `characters` を join する。`ONLY_FULL_GROUP_BY` を満たすため、
  ORDER BY に使う `series` / `sort` も **GROUP BY に含める**（`character_name` と 1 対 1 なのでグループ数は増えない）。

## 5. 表示仕様

| 画面 | 内容 |
|---|---|
| `/`（トップ） | 全キャラの pair 集計（`GET /analysis`）を取得し、**10 秒ごとに 1 キャラずつ自動で順送り**表示 |
| `/[charaName]` | そのキャラの pair 集計（横棒グラフ、`maxCount` で正規化）＋ 30 日の折れ線グラフ |

> トップの自動順送りは「**全キャラ分を一番安く見せる手段**」として選んだもので、
> デザイン上の必然性から導かれたものではない。より良い見せ方があれば替えてよい。

- 見出しは「**〇〇 推しの人が同時に推すのは、**」。[01](./01-domain.md) §2.2 の非対称な読み方に対応する。
- データが 0 件なら「データがまだ有りません…投票をお願いします！」を表示する。
- 折れ線は `datasets.length > 0` のときだけ描画する。

## 6. 使われていない実装

`getVotesRelatedToOshi(oshi, maxDate?)`（`Votes` を as-of 走査する旧実装）は**本番の read パスから呼ばれない**。

- 定義とコメント以外に参照がない（2026-07-10 時点）。将来の過去日 ad-hoc 分析のための残置。
- **テストは削除する**（§7.1）。デッドコードのテストは実装を守っていない。

## 7. テスト（実 MySQL に対する統合テスト）

実装: `server-ts/src/lib/{votes,users}.test.ts`（Vitest）。

- **これらは単体テストではなく統合テストである。** 正しさが SQL（self-join / CTE / `ON DUPLICATE KEY UPDATE`）に
  宿っているため、DB をモックすると「モックが返した値を返した」ことしか確認できない。
  **実 DB は SUT ではなく環境**である。sqlite で代替すると方言差（CTE・upsert・`CONVERT_TZ`）で偽の安心を買う。
- `test/globalSetup.ts` が `<MYSQL_DATABASE>_test` を DROP → CREATE → GRANT し、
  `drizzle-kit push` + `addTestData.ts`（seed）を流す。teardown で DROP。`fileParallelism: false`。
- 実行はローカルでは**コンテナ内**（`pnpm test` = `docker compose exec server pnpm test`）。
  CI は GitHub Actions の `services: mysql:8.4` に対して直接動かす（[09](./09-roadmap.md) §2.5）。
- 時刻依存（`getTimelineData`）は `vi.setSystemTime('2024-01-05T12:00:00+09:00')` で固定する。

### 7.1 テストの作り替え（2026-07-10 決定）

現行 12 件の snapshot は **3 テーブル移行の安全網（足場）**として作られたもので、移行完了により役目を終えた。

- **削除**: `getVotesRelatedToOshi` × 3（デッドコード）、`getLatestVotes` × 3 /
  `getLatestUserState` × 2 / `getUserStatesMaster`（seed した行がそのまま返るだけ ＝ ORM の疎通確認）。
- **残す（明示 assert に書き直す）**: `getTimelineData`、`insertUserStatesIfUpdated`（同日再更新）。
  テスト名も**ドメインの言葉**にする（「PK 衝突しない」→「同じ日に 2 回投票したら後の投票が採用される」）。
- **新規**: ①集計の決定性（§4 の `ORDER BY`）②as-of 集計の歯抜けなしと冪等性（§2）
  ③`insertVotesIfUpdated` の書き込み ④`getTimelineData` の合成・境界。
- **arrange はテスト内で組む**（seed 非依存）。各テストが専用 `twitterID` で投票を作り、集計して assert し、後始末する。
  `addTestData.ts` は開発用 seed としてのみ残す。

> ⚠️ 現行テストは `byName()` / `bySeries()` でソートしてから snapshot を取るため、
> **§4 の決定性（`ORDER BY`）を一切検証していない**。壊しても緑のままである。これが新規 ① の動機。
