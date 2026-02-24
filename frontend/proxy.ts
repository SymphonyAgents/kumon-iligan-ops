import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[]) =>
          cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();

  const protectedRoutes = ['/dashboard', '/onboarding'];
  const authRoutes = ['/login'];

  if (!session && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
