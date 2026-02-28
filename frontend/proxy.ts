import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ROUTES, PROTECTED_ROUTES, AUTH_ROUTES } from '@/lib/routes';

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

  // Root "/" — redirect based on session
  if (pathname === ROUTES.ROOT) {
    return NextResponse.redirect(
      new URL(session ? ROUTES.TRANSACTIONS : ROUTES.LOGIN, request.url),
    );
  }

  if (!session && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  if (session && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.TRANSACTIONS, request.url));
  }

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
