import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow devserver-neo origin for HMR WebSocket (Next.js 16+)
  allowedDevOrigins: ['kumon-iligan.devapp.symph.co'],

  // Add image domains and other config as needed
  transpilePackages: ['@react-pdf/renderer'],

  // Proxy /api/backend/* → NestJS on localhost:3001.
  // NEXT_PUBLIC_API_URL is set to /api/backend in .env.local so browser
  // API calls go through this same-origin proxy instead of localhost:3001
  // directly (which fails from outside the devserver container).
  rewrites: async () => [
    {
      source: '/api/backend/:path*',
      destination: 'http://localhost:3001/:path*',
    },
  ],

  // Prevent CDN (Google Frontend) from caching HTML pages.
  // Without this, s-maxage=31536000 causes stale HTML to be served
  // after deploys — the CDN serves old HTML referencing old JS chunks.
  headers: async () => [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'private, no-cache, no-store, max-age=0, must-revalidate',
        },
      ],
    },
  ],
};

export default nextConfig;
