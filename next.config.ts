import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: false,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  pageExtensions: ['page.tsx', 'page.ts'],
};

export default nextConfig;
