import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sneakerdoc',
  description: 'Point-of-sale system for The Sneaker Doctor',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SneakerDoc',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Catch JS errors before React hydrates — helps debug old device failures */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.onerror=function(m,u,l,c,e){var d=document.getElementById('js-error-banner');if(d){d.textContent='JS Error: '+m+' ('+u+':'+l+')';d.style.display='block';}};`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="js-error-banner" style={{display:'none',position:'fixed',top:0,left:0,right:0,background:'#ef4444',color:'#fff',padding:'12px',fontSize:'13px',zIndex:99999,wordBreak:'break-all'}} />
        <NavigationProgress />
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
