-- 投票データ集計の改修：本番マイグレーション
-- 設計の詳細は docs/vote-aggregation-redesign.md を参照。
--
-- 対象は Votes / UserStates の date 化と、LatestVotes / DailyOshiCount の新設のみ。
-- better-auth の認証テーブル（user/session/account/verification）には触れない。
--
-- 実行前に置換すること：
--   <APP_USER>   … アプリが接続する MySQL ユーザ名（本番はテーブル単位権限）
-- データベースは接続時に USE 済みである前提（mysql ... <db> < この .sql）。
--
-- 手順（メンテ枠・アプリ停止中に実行）：
--   1. 直前バックアップを取得
--   2. Phase 1 → 2 → 2.5 → 3（Phase 3 は backfillDailyOshiCount.ts）
--   3. 新コードをデプロイ・動作確認後にメンテ解除
-- MySQL 8.4 想定。

-- ============================================================
-- Phase 1: Votes + UserStates の date 化（同一トランザクション）
-- ============================================================
BEGIN;

-- Votes: voted_time(TIMESTAMP, UTC) → voted_date(DATE, JST)
ALTER TABLE Votes ADD COLUMN voted_date DATE NULL AFTER voted_time;
UPDATE Votes SET voted_date = DATE(CONVERT_TZ(voted_time, '+00:00', '+09:00'));
-- 同日複数投票は最新 voted_time の行だけ残して重複を解消（date PK 化のため）
DELETE v1 FROM Votes v1
JOIN Votes v2
  ON  v1.twitter_id     = v2.twitter_id
  AND v1.voted_date     = v2.voted_date
  AND v1.character_name = v2.character_name
  AND v1.voted_time     < v2.voted_time;
ALTER TABLE Votes
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (twitter_id, voted_date, character_name),
  MODIFY voted_date DATE NOT NULL,
  DROP COLUMN voted_time;

-- UserStates: recorded_time → recorded_date 同様
ALTER TABLE UserStates ADD COLUMN recorded_date DATE NULL;
UPDATE UserStates SET recorded_date = DATE(CONVERT_TZ(recorded_time, '+00:00', '+09:00'));
DELETE u1 FROM UserStates u1
JOIN UserStates u2
  ON  u1.twitter_id    = u2.twitter_id
  AND u1.recorded_date = u2.recorded_date
  AND u1.series        = u2.series
  AND u1.recorded_time < u2.recorded_time;
ALTER TABLE UserStates
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (twitter_id, recorded_date, series),
  MODIFY recorded_date DATE NOT NULL,
  DROP COLUMN recorded_time;

COMMIT;

-- ============================================================
-- Phase 2: 新テーブル作成 + LatestVotes populate
-- ============================================================
BEGIN;

CREATE TABLE LatestVotes (
  twitter_id     VARCHAR(32) NOT NULL,
  voted_date     DATE        NOT NULL,
  character_name VARCHAR(20) NOT NULL,
  level          TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (twitter_id, character_name),
  KEY idx_character_name (character_name),
  FOREIGN KEY (character_name) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 各ユーザの最新日の投票を現在状態として展開
INSERT INTO LatestVotes (twitter_id, voted_date, character_name, level)
SELECT v.twitter_id, v.voted_date, v.character_name, v.level
FROM Votes v
WHERE v.voted_date = (
  SELECT MAX(v2.voted_date) FROM Votes v2 WHERE v2.twitter_id = v.twitter_id
);

CREATE TABLE DailyOshiCount (
  snapshot_date   DATE         NOT NULL,
  oshi            VARCHAR(20)  NOT NULL,
  related_chara   VARCHAR(20)  NOT NULL,
  count           INT UNSIGNED NOT NULL,
  PRIMARY KEY (snapshot_date, oshi, related_chara),
  KEY idx_oshi_date (oshi, snapshot_date),
  FOREIGN KEY (oshi) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (related_chara) REFERENCES Characters(name)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMIT;

-- ============================================================
-- Phase 2.5: アプリユーザへの権限付与（本番はテーブル単位権限）
-- 付与漏れだとアプリから errno 1142。ローカルでは再現しないので忘れやすい。
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON LatestVotes    TO '<APP_USER>'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON DailyOshiCount TO '<APP_USER>'@'%';
FLUSH PRIVILEGES;

-- ============================================================
-- Phase 3: DailyOshiCount の 30 日分 backfill
--   → server-ts/backfillDailyOshiCount.ts を実行（pnpm tsx backfillDailyOshiCount.ts）
-- ============================================================
