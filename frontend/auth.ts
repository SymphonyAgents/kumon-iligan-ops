import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname === '/login';
      const isPendingPage = nextUrl.pathname === '/pending';

      if (!isLoggedIn && !isOnLoginPage) {
        return Response.redirect(new URL('/login', nextUrl));
      }
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (isLoggedIn && auth.user.status === 'pending' && !isPendingPage) {
        return Response.redirect(new URL('/pending', nextUrl));
      }
      if (isLoggedIn && auth.user.status === 'rejected' && !isPendingPage) {
        return Response.redirect(new URL('/pending', nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // On first sign-in: sync user to backend
      if (user) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        try {
          const res = await fetch(`${apiUrl}/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: token.sub,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });
          if (res.ok) {
            const dbUser = await res.json() as {
              id: string;
              userType: string;
              status: string;
              branchId: number | null;
              fullName: string | null;
              nickname: string | null;
            };
            token.id = dbUser.id;
            token.userType = dbUser.userType;
            token.status = dbUser.status;
            token.branchId = dbUser.branchId;
            token.fullName = dbUser.fullName;
            token.nickname = dbUser.nickname;
          }
        } catch {
          // Backend not available — still allow auth, but user will have no role
        }
      }
      // On session refresh trigger
      if (trigger === 'update' && session?.refreshUser) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        try {
          const res = await fetch(`${apiUrl}/users/${token.id}`, {
            headers: { 'x-user-id': token.id as string },
          });
          if (res.ok) {
            const dbUser = await res.json() as {
              userType: string;
              status: string;
              branchId: number | null;
              fullName: string | null;
              nickname: string | null;
            };
            token.userType = dbUser.userType;
            token.status = dbUser.status;
            token.branchId = dbUser.branchId;
            token.fullName = dbUser.fullName;
            token.nickname = dbUser.nickname;
          }
        } catch { /* ignore */ }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.userType) session.user.userType = token.userType as string;
      if (token.status) session.user.status = token.status as string;
      if (token.branchId !== undefined) session.user.branchId = token.branchId as number | null;
      if (token.fullName !== undefined) session.user.fullName = token.fullName as string | null;
      if (token.nickname !== undefined) session.user.nickname = token.nickname as string | null;
      return session;
    },
  },
});
