import { db, connection } from './src/db';
import { characters, votes } from './src/db/schema';


await db.insert(characters).values([
  { name: '柊夜ノ介', series: 4, sort: 1 },
  { name: '氷上格',   series: 2, sort: 1 },
  { name: '紺野玉緒', series: 3, sort: 3 },
]);

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
    twitterID: 'testID2',
    votedTime: new Date('2023/05/31 00:00:00'),
    characterName: '柊夜ノ介',
    level: 2,
  }, {
    twitterID: 'testID2',
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

await connection.end();

