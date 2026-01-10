/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only use rewrites for local development
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
  // Next.js 15 uses React 19 with improved hydration
  reactStrictMode: true,
  output: 'standalone',
}

module.exports = nextConfig
