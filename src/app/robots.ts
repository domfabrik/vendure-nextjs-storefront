import type { MetadataRoute } from 'next';

import { envServer } from '@/shared/config/index.server';
import { isIndexationAllowed, PRODUCTION_ORIGIN } from '@/shared/lib';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const allowIndexation = isIndexationAllowed(envServer.INDEXATION_ALLOW, envServer.STOREFRONT_ORIGIN);

  if (allowIndexation) {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: `${PRODUCTION_ORIGIN}/sitemap.xml`,
    };
  }

  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
