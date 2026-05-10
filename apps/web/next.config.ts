import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output: bundles only the files needed for production,
  // making Docker images much smaller. Required by Dockerfile.frontend.
  output: 'standalone',

  // Allow devserver-neo origin for HMR WebSocket (Next.js 16+)
  allowedDevOrigins: ['kumon-iligan.devapp.symph.co'],

  // Add image domains and other config as needed
  transpilePackages: ['@react-pdf/renderer'],

  // Proxy /api/backend/* → NestJS backend.
  // NEXT_PUBLIC_API_URL=/api/backend is baked into the image once and never
  // changes. BACKEND_URL is a server-side env var injected at runtime
  // (Cloud Run env or .env.local for dev) so the frontend image never
  // needs to be rebuilt when the backend URL changes.
  rewrites: async () => {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

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
