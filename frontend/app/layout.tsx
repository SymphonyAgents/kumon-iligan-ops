import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kumon Iligan Ops',
  description: 'Tuition payment management for Kumon Iligan',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.png' },
  themeColor: '#09090b',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kumon Iligan' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.onerror=function(m,u,l,c,e){var d=document.getElementById('js-error-banner');if(d){d.textContent='JS Error: '+m+' ('+u+':'+l+')';d.style.display='block';}};`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="js-error-banner" style={{display:'none',position:'fixed',top:0,left:0,right:0,background:'#ef4444',color:'#fff',padding:'12px',fontSize:'13px',zIndex:99999,wordBreak:'break-all'}} />
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
