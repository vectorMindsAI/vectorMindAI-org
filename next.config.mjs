/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Fix TypeScript errors and set to false before production
    ignoreBuildErrors: true,
  },
  images: {
    // TODO: Enable image optimization in production for better performance
    unoptimized: true,
  },
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false, // Hide X-Powered-By header for security
  compress: true, // Enable gzip compression
}

export default nextConfig
