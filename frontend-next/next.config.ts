import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript checking during build
    ignoreBuildErrors: true,
  },
  
  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Configure webpack for better hot reload
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Improve hot reload performance and fix HMR issues
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
        
        // Fix HMR for development
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        };
      }
      return config;
    },
    
    // Note: allowedDevOrigins removed as it's not yet available in Next.js 15
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
};

export default nextConfig;
