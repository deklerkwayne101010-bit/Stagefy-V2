import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Supabase Storage uploads and Vercel preview deploys
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
  // Prevent stale-cache 304 issues across all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma',               value: 'no-cache' },
        ],
      },
    ];
  },
};

export default nextConfig;
