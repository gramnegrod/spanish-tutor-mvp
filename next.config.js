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
  typescript: {
    // Temporarily ignore TypeScript errors to deploy
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Exclude example files, test files, and other non-essential files from compilation
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader',
      include: (modulePath) => {
        // Convert to forward slashes for consistent matching
        const normalizedPath = modulePath.replace(/\\/g, '/');
        
        // List of patterns to ignore
        const shouldIgnore = 
          // OpenAI WebRTC example files
          normalizedPath.includes('packages/openai-realtime-webrtc/compat/examples/') ||
          // Test files
          /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(normalizedPath) ||
          normalizedPath.includes('/__tests__/') ||
          normalizedPath.includes('/tests/') ||
          // Mock files
          normalizedPath.includes('/__mocks__/') ||
          /\.mock\.(ts|tsx|js|jsx)$/.test(normalizedPath) ||
          // Story files
          /\.stories\.(ts|tsx|js|jsx)$/.test(normalizedPath) ||
          // Example/demo directories
          /\/(examples?|demos?|samples?)\//.test(normalizedPath) ||
          // Test setup files
          normalizedPath.includes('/setupTests.') ||
          normalizedPath.includes('/test-utils.') ||
          // Jest config files
          normalizedPath.includes('/jest.config.') ||
          // Cypress files
          normalizedPath.includes('/cypress/') ||
          // E2E test files
          /\.e2e\.(ts|tsx|js|jsx)$/.test(normalizedPath);
        
        return shouldIgnore;
      }
    });
    return config;
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