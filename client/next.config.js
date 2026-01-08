/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
  // Next.js 15 uses React 19 with improved hydration
  reactStrictMode: true,
}

module.exports = nextConfig
