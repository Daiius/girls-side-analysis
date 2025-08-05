import { 
  mysqlTable, 
  primaryKey, 
  tinyint, 
  varchar,
  timestamp 
} from 'drizzle-orm/mysql-core';

/**
 * 登場人物を記録したテーブル
 */
export const characters = mysqlTable(
  'Characters', 
  {
    series: 
      tinyint('series', { unsigned: true }).notNull(),
    sort:
      tinyint('sort', { unsigned: true }).notNull(),
    name: 
      varchar('name', { length: 20 }).unique().notNull(),
  }, 
  (table) => [
    primaryKey({ columns: [table.series, table.sort] }),
  ],
);

/**
 * 推しデータ登録
 */
export const votes = mysqlTable(
  'Votes', 
  {
    twitterID: 
      varchar('twitter_id', { length: 32 }).notNull(),
    votedTime: 
      timestamp('voted_time').notNull().defaultNow(),

    characterName: 
      varchar('character_name', { length: 20 }).notNull()
        .references(
          () => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }
        ),
    level:
      tinyint('level', { unsigned: true }).notNull(),
  }, 
  (table) => [
    primaryKey({ 
      columns: [
        table.twitterID, 
        table.votedTime,
        table.characterName,
      ]
    }),
  ],
);

/**
 * GSシリーズのプレイ状態の選択肢テーブル
 */
export const userStatesMaster = mysqlTable(
  'UserStatesMaster', 
  {
    state:
      varchar('state', { length: 20 }).primaryKey(),
    sort:
      tinyint('sort', { unsigned: true }).notNull(),
  },
);

/**
 * TwitterIDとGSシリーズのプレイ状態を紐づけるテーブル
 */
export const userStates = mysqlTable(
  'UserStates', 
  {
    twitterID:
      varchar('twitter_id', { length: 20 }).notNull(),
    recordedTime:
      timestamp('recorded_time').defaultNow().notNull(),
    series:
      tinyint('series', { unsigned: true }).notNull(),
    status:
      varchar('status', { length: 20 }).notNull()
        .references(
          () => userStatesMaster.state,
          { onUpdate: 'cascade', onDelete: 'restrict' }
        ),
  }, 
  (table) => [
    primaryKey({ columns: [
      table.twitterID, 
      table.recordedTime, 
      table.series
    ]}),
  ],
);

