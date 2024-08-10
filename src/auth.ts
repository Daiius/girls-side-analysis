import NextAuth, { DefaultSession, Profile, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Twitter from 'next-auth/providers/twitter';

declare module 'next-auth' {
  interface Profile {
    data: {
      name: string;
      profile_image_url: string;
      id: string;
      username: string;
    }
  }

  interface Session {
    user: {
      username: string;
    } & DefaultSession['user']
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [Twitter],
  debug: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.data.id;
        token.username = profile.data.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl }}) {
      console.log('authorized, auth: ', auth);
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/girls-side-analysis';
      const isOnProfile = nextUrl.pathname === '/girls-side-analysis/profile';
      if (!isLoggedIn) {
        if (!isOnProfile && !isOnRoot) {
          return Response.redirect(new URL('/girls-side-analysis', nextUrl));
        }
        return true;
      }
      return true;
    },
  }
});


