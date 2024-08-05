import { datetime, mysqlTable, primaryKey, tinyint, varchar } from 'drizzle-orm/mysql-core';

/**
 * 登場人物を記録したテーブル
 */
export const characters = mysqlTable('Characters', {
  series: 
    tinyint('series', { unsigned: true }).notNull(),
  sort:
    tinyint('sort', { unsigned: true }).notNull(),
  name: 
    varchar('name', { length: 20 }).unique().notNull(),
}, (table) => ({
  primaryKey:
    primaryKey({ columns: [table.series, table.sort] }),
}));

/**
 * 推しデータ登録
 */
export const votes = mysqlTable('Votes', {
  twitterID: 
    varchar('twitter_id', { length: 32 }).notNull(),
  votedTime: 
    datetime('voted_time').notNull(),

  characterName: 
    varchar('character_name', { length: 20 })
      .references(
        () => characters.name, {
          onUpdate: 'cascade',
          onDelete: 'restrict',
        }
      ),
  level:
    tinyint('level', { unsigned: true }).notNull(),
}, (table) => ({
  primaryKey: 
    primaryKey({ 
      columns: [
        table.twitterID, 
        table.votedTime,
        table.characterName,
      ]
    }),
}));


