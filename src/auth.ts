import NextAuth from 'next-auth';
import Twitter from 'next-auth/providers/twitter';

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [Twitter({
    profile(profile) {
      return {
        id: profile.id_str as string,
        name: profile.name as string,
        image: profile.profile_image_url_https as string,
      }
    }
  })],
  debug: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('jwt, token: ', token);
      console.log('jwt, account: ', account);
      console.log('jwt, profile: ', profile);
      if (account && profile) {
        token.sub = profile.id ?? '';
        token.email = profile.email;
        token.username = profile.login;
      }
      console.log('jwt, token: ', token);
      return token;
    },
    async session({ session, token }) {
      console.log('session, token: ', token);
      session.user.id = token.sub ?? '';
      session.user.email = token.email ?? '';
      //session.user.username = token.username ?? '';
      console.log('session, session: ', session);
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


