import type { MetadataRoute } from 'next';

import { getAllCollections, searchProducts } from '@/shared/api';
import { envServer } from '@/shared/config/index.server';

const SITEMAP_PAGE_SIZE = 100;
const SERVICE_COLLECTION_SLUGS = new Set(['all', 'search', '__root_collection__']);

const STATIC_PAGES: Array<{ path: string; changeFrequency: 'monthly' | 'weekly'; priority: number }> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contacts', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/delivery', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/how-to-buy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/juristic/policy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/juristic/returns', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/juristic/terms', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/juristic/user-agreement', changeFrequency: 'monthly', priority: 0.3 },
];

function getSiteOrigin(): string {
  return envServer.SITE_URL.replace(/\/+$/, '');
}

function buildPublicUrl(path: string): string {
  return new URL(path, `${getSiteOrigin()}/`).toString();
}

async function getAllProductSlugs(): Promise<string[]> {
  const firstPage = await searchProducts({ take: SITEMAP_PAGE_SIZE, skip: 0 });
  const products = [...firstPage.items];

  for (let skip = SITEMAP_PAGE_SIZE; skip < firstPage.totalItems; skip += SITEMAP_PAGE_SIZE) {
    const page = await searchProducts({ take: SITEMAP_PAGE_SIZE, skip });
    products.push(...page.items);
  }

  return [...new Set(products.map((product) => product.slug.trim()).filter(Boolean))];
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, productSlugs] = await Promise.all([getAllCollections(), getAllProductSlugs()]);

  const collectionEntries = collections
    .filter((collection) => collection.slug && !SERVICE_COLLECTION_SLUGS.has(collection.slug))
    .map((collection) => ({
      url: buildPublicUrl(`/collections/${encodeURIComponent(collection.slug)}`),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  const productEntries = productSlugs.map((slug) => ({
    url: buildPublicUrl(`/products/${encodeURIComponent(slug)}`),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...STATIC_PAGES.map((page) => ({
      url: buildPublicUrl(page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...collectionEntries,
    ...productEntries,
  ];
}
