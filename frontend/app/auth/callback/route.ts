import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Use the public app URL env var so it works correctly behind a reverse proxy
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) =>
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.session) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const provisionRes = await fetch(`${apiUrl}/users/provision`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      }).catch(() => null);

      // If user is pending/rejected, redirect to pending page instead of app
      if (provisionRes?.ok) {
        try {
          const user = await provisionRes.json() as { status?: string };
          if (user.status === 'pending' || user.status === 'rejected') {
            return NextResponse.redirect(`${appUrl}/pending`);
          }
        } catch { /* fall through to default redirect */ }
      }

      return NextResponse.redirect(`${appUrl}/`);
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
}
