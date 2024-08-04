import { db, connection } from './db';
import { characters, votes } from './db/schema';


await db.insert(characters).values([
  { name: '柊夜ノ介', series: 4, sort: 1 },
  { name: '氷上格',   series: 2, sort: 1 },
]);

await db.insert(votes).values([
  {
    twitterID: 'testID',
    votedTime: new Date('2023/09/21 00:00:00'),
    characterName: '柊夜ノ介',
    level: 1,
  }, { 
    twitterID: 'testID', 
    votedTime: new Date('2024/01/01 00:00:00'), 
    characterName: '氷上格',
    level: 1,
  }, {
    twitterID: 'testID',
    votedTime: new Date('2024/01/01 00:00:00'),
    characterName: '柊夜ノ介',
    level: 2,
  }
]);

await connection.end();

