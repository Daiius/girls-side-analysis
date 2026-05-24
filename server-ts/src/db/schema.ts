import {
  mysqlTable,
  primaryKey,
  tinyint,
  varchar,
  timestamp,
  date,
  int,
  text,
  boolean,
  index,
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
    // 同日内の精度は不要なため DATE。mode:'string' で 'YYYY-MM-DD' を
    // ドライバ TZ 解釈を介さずそのまま扱う。
    votedDate:
      date('voted_date', { mode: 'string' }).notNull(),

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
        table.votedDate,
        table.characterName,
      ]
    }),
  ],
);

/**
 * ユーザごとの「現在の推し set」。
 * read 中心ワークロード向けに、最新投票を毎 read 計算する代わりに保持する。
 * 投票時に per-user で DELETE + INSERT して置き換える。
 */
export const latestVotes = mysqlTable(
  'LatestVotes',
  {
    twitterID:
      varchar('twitter_id', { length: 32 }).notNull(),
    votedDate:
      date('voted_date', { mode: 'string' }).notNull(),
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
    primaryKey({ columns: [table.twitterID, table.characterName] }),
    index('idx_character_name').on(table.characterName),
  ],
);

/**
 * 過去日の pair 集計 snapshot。
 * 夜間 cron が「昨日終了時点」の LatestVotes を集計して書き込む。
 * 今日分は LatestVotes 集計で代替するため、ここには含めない。
 */
export const dailyOshiCount = mysqlTable(
  'DailyOshiCount',
  {
    snapshotDate:
      date('snapshot_date', { mode: 'string' }).notNull(),
    oshi:
      varchar('oshi', { length: 20 }).notNull()
        .references(
          () => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }
        ),
    relatedChara:
      varchar('related_chara', { length: 20 }).notNull()
        .references(
          () => characters.name,
          { onUpdate: 'cascade', onDelete: 'restrict' }
        ),
    count:
      int('count', { unsigned: true }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.snapshotDate, table.oshi, table.relatedChara],
    }),
    index('idx_oshi_date').on(table.oshi, table.snapshotDate),
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
    recordedDate:
      date('recorded_date', { mode: 'string' }).notNull(),
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
      table.recordedDate,
      table.series
    ]}),
  ],
);

// ============================================================
// better-auth 認証テーブル
// ============================================================
// CLI @better-auth/cli で生成した雛形を本プロジェクトに統合。
// twitterId は user.additionalFields で拡張した独自カラム。

export const user = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  twitterId: varchar('twitter_id', { length: 32 }).unique(),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = mysqlTable(
  'session',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    expiresAt: timestamp('expires_at', { fsp: 3 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = mysqlTable(
  'account',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { fsp: 3 }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { fsp: 3 }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = mysqlTable(
  'verification',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { fsp: 3 }).notNull(),
    createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);
