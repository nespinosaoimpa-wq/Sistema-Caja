/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake large icon/chart libraries — only bundle what's actually imported
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Strip console.log/warn from production bundles (keep console.error for debugging)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }
      : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdaqvqhcfuyxitnpsesq.supabase.co',
      },
    ],
  },
  // PWA headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
