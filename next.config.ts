import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: false,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
