import {
  characters,
  votes,
  latestVotes,
  userStatesMaster,
  userStates,
} from './src/db/schema';

import { charactersMaster } from './charactersMaster';

import { drizzle } from 'drizzle-orm/mysql2';
import { createConnection } from 'mysql2/promise';
import { DateTime } from 'luxon';

import { aggregateOshiCountForDate } from './src/lib/aggregate';

const client = await createConnection({
  host: process.env.DB_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});


const db = drizzle({ client });


// 永続 DB 向けの冪等化: 既にデータがあれば二重投入を避けてスキップする
const existingCount = await db.$count(characters);
if (existingCount > 0) {
  console.log(`addTestData.ts skipped: characters に既に ${existingCount} 件あります`);
  await client.end();
  process.exit(0);
}


// キャラマスタ（name / series / sort / reading）は charactersMaster.ts に集約。
// 既存 DB への reading 後付けは drizzle マイグレーション（*_backfill_readings）が担当。
await db.insert(characters).values(charactersMaster);

// プレイ状態の選択肢を生成
await db.insert(userStatesMaster).values([
  { state: '未プレイ', sort: 0 },
  { state: '実況視聴', sort: 1 },
  { state: 'プレイ済み', sort: 2 },
]);

// ID毎にプレイ状態を記録
await db.transaction(async (_tx) =>{
  // GS4を初プレイしたtestIDさん
  const twitterID = 'testID';
  const recordedDate = '2023-09-21';
  await db.insert(userStates).values([
    { twitterID, recordedDate, series: 1, status: '未プレイ' },
    { twitterID, recordedDate, series: 2, status: '未プレイ' },
    { twitterID, recordedDate, series: 3, status: '未プレイ' },
    { twitterID, recordedDate, series: 4, status: 'プレイ済み' },
  ]);
});

await db.transaction(async (_tx) => {
  // 年が変わるまでに一通りプレイした記録を追加
  const twitterID = 'testID';
  const recordedDate = '2024-01-01';
  await db.insert(userStates).values([
    { twitterID, recordedDate, series: 1, status: 'プレイ済み' },
    { twitterID, recordedDate, series: 2, status: 'プレイ済み' },
    { twitterID, recordedDate, series: 3, status: 'プレイ済み' },
    { twitterID, recordedDate, series: 4, status: 'プレイ済み' },
  ]);
});

await db.transaction(async (_tx) => {
  // 以前から格ヤノ推しの人のプレイ記録
  const twitterID = process.env.TEST_TWITTER_ID ?? 'testID2';
  const recordedDate = '2023-05-31';
  await db.insert(userStates).values([
    { twitterID, recordedDate, series: 1, status: '実況視聴' },
    { twitterID, recordedDate, series: 2, status: 'プレイ済み' },
    { twitterID, recordedDate, series: 3, status: '実況視聴' },
    { twitterID, recordedDate, series: 4, status: 'プレイ済み' },
  ]);
});

// level は「推しの順位」で、UI（dnd-kit の並び）が送るのは **0 始まり**。
// seed もそれに合わせる（1 始まりだと、実際には起こり得ない値で開発することになる）。
await db.insert(votes).values([
  // かつてヤノ単体推しだったある人が、
  {
    twitterID: 'testID',
    votedDate: '2023-09-21',
    characterName: '柊夜ノ介',
    level: 0,
  },
  // GS2をプレイして格くん推しにもなった！
  {
    twitterID: 'testID',
    votedDate: '2024-01-01',
    characterName: '氷上格',
    level: 0,
  }, {
    twitterID: 'testID',
    votedDate: '2024-01-01',
    characterName: '柊夜ノ介',
    level: 1,
  },
  // ある人は登録した時にはすでにヤノくん&格くん推し
  {
    twitterID: process.env.TEST_TWITTER_ID ?? 'testID2',
    votedDate: '2023-05-31',
    characterName: '柊夜ノ介',
    level: 1,
  }, {
    twitterID: process.env.TEST_TWITTER_ID ?? 'testID2',
    votedDate: '2023-05-31',
    characterName: '氷上格',
    level: 0,
  },
  // 格くん推しには玉緒先輩推しもいらっしゃるらしい
  {
    twitterID: 'testID3',
    votedDate: '2023-12-01',
    characterName: '紺野玉緒',
    level: 1,
  }, {
    twitterID: 'testID3',
    votedDate: '2023-12-01',
    characterName: '氷上格',
    level: 0,
  },
]);

// LatestVotes: 各ユーザの「現在の推し set」（= 上記 Votes の最新日分）。
// 本番では投票時に維持されるが、seed では明示投入する。
const testID2 = process.env.TEST_TWITTER_ID ?? 'testID2';
await db.insert(latestVotes).values([
  // testID: 最新は 2024-01-01 の 氷上格 + 柊夜ノ介
  { twitterID: 'testID', votedDate: '2024-01-01', characterName: '氷上格', level: 0 },
  { twitterID: 'testID', votedDate: '2024-01-01', characterName: '柊夜ノ介', level: 1 },
  // testID2: 2023-05-31 の 柊夜ノ介 + 氷上格
  { twitterID: testID2, votedDate: '2023-05-31', characterName: '柊夜ノ介', level: 1 },
  { twitterID: testID2, votedDate: '2023-05-31', characterName: '氷上格', level: 0 },
  // testID3: 2023-12-01 の 紺野玉緒 + 氷上格
  { twitterID: 'testID3', votedDate: '2023-12-01', characterName: '紺野玉緒', level: 1 },
  { twitterID: 'testID3', votedDate: '2023-12-01', characterName: '氷上格', level: 0 },
]);

// DailyOshiCount: 過去日分の pair 集計を backfill する。
// 本番では夜間 cron が日々積み上げるが、seed では固定日範囲をまとめて生成し、
// getTimelineData（過去日は DailyOshiCount 参照）の開発/テストを成立させる。
{
  let d = DateTime.fromISO('2023-12-01');
  const backfillEnd = DateTime.fromISO('2024-01-04');
  while (d <= backfillEnd) {
    await aggregateOshiCountForDate(db, d.toISODate()!);
    d = d.plus({ days: 1 });
  }
}

await client.end();

console.log('addTestData.ts done!')

