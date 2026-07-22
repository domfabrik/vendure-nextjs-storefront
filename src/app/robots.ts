import type { MetadataRoute } from 'next';

import { envServer } from '@/shared/config';

const PRODUCTION_HOST = 'https://domfabrik.ru';

export default function robots(): MetadataRoute.Robots {
  const isProduction = Boolean(envServer.INDEXATION_ALLOW);

  if (isProduction) {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: `${PRODUCTION_HOST}/sitemap.xml`,
    };
  }

  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
