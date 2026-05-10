import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'Kumon Iligan Ops',
  description: 'Tuition payment management for Kumon Iligan',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.png' },
  themeColor: '#1a1d1a',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kumon Iligan' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <NavigationProgress />
            <QueryProvider>{children}</QueryProvider>
            <Toaster position="bottom-right" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
