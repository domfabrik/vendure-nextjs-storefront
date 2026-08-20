import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compress: false,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
      },
    ];
  },
  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    // Хранить кэш картинок в памяти/на диске не дольше 3 дней (в секундах)
    minimumCacheTTL: 259200,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: (process.env.NEXT_PUBLIC_SITE_URL || 'domfabrik.ru').replace('https://', ''),
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
