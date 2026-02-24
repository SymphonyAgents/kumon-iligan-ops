'use client';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-8">Sign in</h1>
      <button
        onClick={handleGoogleLogin}
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        Continue with Google
      </button>
    </main>
  );
}
