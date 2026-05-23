import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import {
  user,
  session,
  account,
  verification,
} from '../db/schema';

const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is required`);
  return value;
};

// 本番では `girls-side-analysis.faveo-systema.net` (Vercel フロント) と
// `api.faveo-systema.net` (このサーバー) で cookie を共有するため、
// AUTH_COOKIE_DOMAIN=.faveo-systema.net を設定する。
// ローカルでは未設定（localhost で同一ホスト）。
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;

// フロントエンドの origin。CORS の許可と trustedOrigins に使う。
const frontendOrigin = required(
  'BETTER_AUTH_URL',
  process.env.BETTER_AUTH_URL,
);

export const auth = betterAuth({
  appName: 'girls-side-analysis',
  baseURL: frontendOrigin,
  secret: required('BETTER_AUTH_SECRET', process.env.BETTER_AUTH_SECRET),

  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema: { user, session, account, verification },
  }),

  socialProviders: {
    twitter: {
      clientId: required('TWITTER_CLIENT_ID', process.env.TWITTER_CLIENT_ID),
      clientSecret: required('TWITTER_CLIENT_SECRET', process.env.TWITTER_CLIENT_SECRET),
      // X Developer Portal で承認されている scope と完全一致させる
      // （better-auth デフォルトの `offline.access` は portal で未承認のため
      //   disableDefaultScope:true で除外）。
      // 本プロジェクトは tweet / email を実利用しないが、portal の承認状況に
      // 合わせて mismatch を避けるためこの 3 つを指定。portal で scope を
      // 減らした場合はここも同期して減らすこと。
      disableDefaultScope: true,
      scope: ['users.read', 'tweet.read', 'users.email'],
      // 念のため email 未取得時の保険（schema 側で notNull のため）。
      // 通常は Twitter から confirmed_email が返ってくる。
      mapProfileToUser: (profile) => ({
        email:
          profile.data.email
          ?? `${profile.data.username ?? profile.data.id}@twitter.local`,
      }),
    },
  },

  trustedOrigins: [frontendOrigin],

  // user.twitterId は Twitter user id を保持するカスタムカラム。
  // 既存の Votes.twitter_id / UserStates.twitter_id と紐づけるため。
  user: {
    additionalFields: {
      twitterId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },

  // Twitter account が連携されたタイミングで twitterId を user に同期する
  databaseHooks: {
    account: {
      create: {
        after: async (acc) => {
          if (acc.providerId === 'twitter' && acc.accountId) {
            await db
              .update(user)
              .set({ twitterId: acc.accountId })
              .where(eq(user.id, acc.userId));
          }
        },
      },
    },
  },

  advanced: {
    cookiePrefix: 'gsa',
    ...(cookieDomain && {
      defaultCookieAttributes: {
        domain: cookieDomain,
        secure: true,
        sameSite: 'lax' as const,
      },
    }),
  },
});
