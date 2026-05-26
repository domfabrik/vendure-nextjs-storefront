import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: false,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  experimental: {
    largePageDataBytes: 500 * 1000,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
