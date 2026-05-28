import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: false,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  images: {
    unoptimized: false,
    // Хранить кэш картинок в памяти/на диске не дольше 3 дней (в секундах)
    minimumCacheTTL: 259200,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'test.domfabrik.ru',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
