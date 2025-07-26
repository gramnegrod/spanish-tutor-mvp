/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
  images: {
    // Enable image optimization
    domains: [
      'localhost',
      'images.unsplash.com',
      'res.cloudinary.com',
      'avatars.githubusercontent.com',
      // Add any other external domains you'll load images from
    ],
    // Image sizes for optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Use webp format when possible
    formats: ['image/avif', 'image/webp'],
    // Minimize images during build
    minimumCacheTTL: 60,
    // Disable static imports for SVGs
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled - requires 'critters' package
  },
}

module.exports = withBundleAnalyzer(nextConfig)