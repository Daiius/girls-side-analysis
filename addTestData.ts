import { 
  characters, 
  votes,
  userStatesMaster,
  userStates,
} from './src/db/schema';

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});


const db = drizzle(connection);


await db.insert(characters).values([
  // GS1
  { name: '葉月珪',     series: 1, sort: 1 },
  { name: '守村桜弥',   series: 1, sort: 2 },
  { name: '三原色',     series: 1, sort: 3 },
  { name: '姫条まどか', series: 1, sort: 4 },
  { name: '鈴鹿和馬',   series: 1, sort: 5 },
  { name: '日比谷渉',   series: 1, sort: 6 },
  { name: '氷室零一',   series: 1, sort: 7 },
  { name: '天之橋一鶴', series: 1, sort: 8 },
  { name: '蒼樹千晴',   series: 1, sort: 9 },
  { name: '天童壬',     series: 1, sort: 10 },
  { name: '益田義人',   series: 1, sort: 11 },
  { name: '有沢志穂',   series: 1, sort: 12 },
  { name: '須藤瑞希',   series: 1, sort: 13 },
  { name: '藤井奈津美', series: 1, sort: 14 },
  { name: '紺野珠美',   series: 1, sort: 15 },
  { name: '尽',         series: 1, sort: 16 },
  { name: '花椿吾郎',   series: 1, sort: 17 },
  { name: 'ギャリソン伊藤',   series: 1, sort: 18 },
  // GS2
  { name: '佐伯瑛',     series: 2, sort: 1 },
  { name: '志波勝己',   series: 2, sort: 2 },
  { name: '氷上格',     series: 2, sort: 3 },
  { name: '針谷幸之進', series: 2, sort: 4 },
  { name: 'クリストファー・ウェザーフィールド', series: 2, sort: 5},
  { name: '天地翔太',   series: 2, sort: 6 },
  { name: '若王子貴文', series: 2, sort: 7 },
  { name: '真咲元春',   series: 2, sort: 8 },
  { name: '赤城一雪',   series: 2, sort: 9 },
  { name: '古森拓',     series: 2, sort: 10 },
  { name: '真嶋太郎',   series: 2, sort: 11 },
  { name: '藤堂竜子',   series: 2, sort: 12 },
  { name: '小野田千代美', series: 2, sort: 13 },
  { name: '西本はるひ', series: 2, sort: 14 },
  { name: '水島密',     series: 2, sort: 15 },
  { name: '花椿姫子',   series: 2, sort: 16 },
  { name: '音成遊',     series: 2, sort: 17 },
  // GS3
  { name: '桜井琉夏',   series: 3, sort: 1 },
  { name: '桜井琥一',   series: 3, sort: 2 },
  { name: '不二山嵐',   series: 3, sort: 3 },
  { name: '新名旬平',   series: 3, sort: 4 },
  { name: '紺野玉緒',   series: 3, sort: 5 },
  { name: '設楽聖司',   series: 3, sort: 6 },
  { name: '蓮見達也',   series: 3, sort: 7 },
  { name: '大迫力',     series: 3, sort: 8 },
  { name: '春日太陽',   series: 3, sort: 9 },
  { name: '藍沢秋吾',   series: 3, sort: 10 },
  { name: '平健太',     series: 3, sort: 11 },
  { name: '宇賀神みよ', series: 3, sort: 12 },
  { name: '花椿カレン', series: 3, sort: 13 },
  // GS4
  { name: '風真玲太',   series: 4, sort: 1 },
  { name: '颯砂希',     series: 4, sort: 2 },
  { name: '本多行',     series: 4, sort: 3 },
  { name: '七ツ森実',   series: 4, sort: 4 },
  { name: '柊夜ノ介',   series: 4, sort: 5 },
  { name: '氷室一紀',   series: 4, sort: 6 },
  { name: '御影小次郎', series: 4, sort: 7 },
  { name: '白羽大地',   series: 4, sort: 8 },
  { name: '白羽空也',   series: 4, sort: 9 },
  { name: '巴征道',     series: 4, sort: 10 },
  { name: '大成功',     series: 4, sort: 11 },
  { name: '花椿みちる', series: 4, sort: 12 },
  { name: '花椿ひかる', series: 4, sort: 13 },
]);

// プレイ状態の選択肢を生成
await db.insert(userStatesMaster).values([
  { state: '未プレイ', sort: 0 },
  { state: '実況視聴', sort: 1 },
  { state: 'プレイ済み', sort: 2 },
]);

if (process.env.NODE_ENV === 'development') {
  // ID毎にプレイ状態を記録
  await db.transaction(async (_tx) =>{
    // GS4を初プレイしたtestIDさん
    const twitterID = 'testID';
    const recordedTime = new Date('2023/09/21 00:00:00'); 
    await db.insert(userStates).values([
      { twitterID, recordedTime, series: 1, status: '未プレイ' }, 
      { twitterID, recordedTime, series: 2, status: '未プレイ' }, 
      { twitterID, recordedTime, series: 3, status: '未プレイ' }, 
      { twitterID, recordedTime, series: 4, status: 'プレイ済み' }, 
    ]);
  });

  await db.transaction(async (_tx) => {
    // 年が変わるまでに一通りプレイした記録を追加
    const twitterID = 'testID';
    const recordedTime = new Date('2024/01/01 00:00:00'); 
    await db.insert(userStates).values([
      { twitterID, recordedTime, series: 1, status: 'プレイ済み' }, 
      { twitterID, recordedTime, series: 2, status: 'プレイ済み' }, 
      { twitterID, recordedTime, series: 3, status: 'プレイ済み' }, 
      { twitterID, recordedTime, series: 4, status: 'プレイ済み' }, 
    ]);
  });

  await db.transaction(async (_tx) => {
    // 以前から格ヤノ推しの人のプレイ記録
    const twitterID = process.env.TEST_TWITTER_ID ?? 'testID2';
    const recordedTime = new Date('2023/05/31 00:00:00');
    await db.insert(userStates).values([
      { twitterID, recordedTime, series: 1, status: '実況視聴' }, 
      { twitterID, recordedTime, series: 2, status: 'プレイ済み' }, 
      { twitterID, recordedTime, series: 3, status: '実況視聴' }, 
      { twitterID, recordedTime, series: 4, status: 'プレイ済み' }, 
    ]);
  });

  await db.insert(votes).values([
    // かつてヤノ単体推しだったある人が、
    {
      twitterID: 'testID',
      votedTime: new Date('2023/09/21 00:00:00'),
      characterName: '柊夜ノ介',
      level: 1,
    },
    // GS2をプレイして格くん推しにもなった！
    { 
      twitterID: 'testID', 
      votedTime: new Date('2024/01/01 00:00:00'), 
      characterName: '氷上格',
      level: 1,
    }, {
      twitterID: 'testID',
      votedTime: new Date('2024/01/01 00:00:00'),
      characterName: '柊夜ノ介',
      level: 2,
    },
    // ある人は登録した時にはすでにヤノくん&格くん推し
    {
      twitterID: process.env.TEST_TWITTER_ID ?? 'testID2',
      votedTime: new Date('2023/05/31 00:00:00'),
      characterName: '柊夜ノ介',
      level: 2,
    }, {
      twitterID: process.env.TEST_TWITTER_ID ?? 'testID2',
      votedTime: new Date('2023/05/31 00:00:00'),
      characterName: '氷上格',
      level: 1,
    },
    // 格くん推しには玉緒先輩推しもいらっしゃるらしい
    {
      twitterID: 'testID3',
      votedTime: new Date('2023/12/01 00:00:00'),
      characterName: '紺野玉緒',
      level: 2,
    }, {
      twitterID: 'testID3',
      votedTime: new Date('2023/12/01 00:00:00'),
      characterName: '氷上格',
      level: 1,
    },
  ]);
}

await connection.end();

