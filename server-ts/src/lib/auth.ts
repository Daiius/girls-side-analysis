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
