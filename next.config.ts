import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  images: {
    formats: ['image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
