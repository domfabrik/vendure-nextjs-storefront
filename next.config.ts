import { NextConfig } from 'next';

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://domfabrik.ru';
const normalizedSiteUrl = rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://') ? rawSiteUrl : `https://${rawSiteUrl}`;
const parsedSiteUrl = new URL(normalizedSiteUrl);
const allowLocalImageOptimization = ['127.0.0.1', 'localhost', '0.0.0.0'].includes(parsedSiteUrl.hostname);
const siteRemotePattern = parsedSiteUrl.port
  ? ({
      protocol: parsedSiteUrl.protocol.replace(':', ''),
      hostname: parsedSiteUrl.hostname,
      port: parsedSiteUrl.port,
      pathname: '/**',
    } as NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number])
  : ({
      protocol: parsedSiteUrl.protocol.replace(':', ''),
      hostname: parsedSiteUrl.hostname,
      pathname: '/**',
    } as NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number]);

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
    dangerouslyAllowLocalIP: allowLocalImageOptimization,
    unoptimized: allowLocalImageOptimization,
    dangerouslyAllowSVG: true,
    // Хранить кэш картинок в памяти/на диске не дольше 3 дней (в секундах)
    minimumCacheTTL: 259200,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    remotePatterns: [siteRemotePattern],
  },
};

export default nextConfig;
