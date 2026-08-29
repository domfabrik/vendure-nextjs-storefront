import type { Product, ProductCollection } from '@/shared/api';
import { SITE_NAME } from '@/shared/config';
import { stripHtml } from '@/shared/lib';

export function buildProductJsonLd(product: Product, siteUrl: string) {
  const prices = product.variants.map((v) => v.priceWithTax / 100);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const hasStock = product.variants.some((v) => v.stockLevel !== 'OUT_OF_STOCK' && v.stockLevel !== '0');
  const canonical = `${siteUrl}/products/${product.slug}`;
  const description = product.description ? stripHtml(product.description).slice(0, 5000) : product.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.assets.map((a) => a.preview),
    ...(product.variants[0]?.sku && { sku: product.variants[0].sku }),
    brand: {
      '@type': 'Brand',
      name: product.customFields.vendorName || SITE_NAME,
    },
    ...(product.customFields.weightKg && {
      weight: {
        '@type': 'QuantitativeValue',
        value: product.customFields.weightKg,
        unitCode: 'KGM',
      },
    }),
    offers: {
      '@type': 'AggregateOffer',
      lowPrice,
      highPrice,
      priceCurrency: 'RUB',
      offerCount: product.variants.length,
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonical,
    },
  };
}

const SERVICE_COLLECTION_SLUGS = new Set(['all', 'search', '__root_collection__']);

export function getProductCollectionChain(product: Product): ProductCollection[] {
  const candidates = product.collections.filter((collection) => !SERVICE_COLLECTION_SLUGS.has(collection.slug));
  const deepest = candidates.find((collection) => collection.parent && !SERVICE_COLLECTION_SLUGS.has(collection.parent.slug)) ?? candidates[0];
  if (!deepest) return [];

  const chain: ProductCollection[] = [];
  const seen = new Set<string>();
  let current: ProductCollection | null = deepest;

  while (current && !seen.has(current.slug)) {
    seen.add(current.slug);
    if (!SERVICE_COLLECTION_SLUGS.has(current.slug)) chain.unshift(current);
    const parent: ProductCollection['parent'] = current.parent;
    current = parent && !SERVICE_COLLECTION_SLUGS.has(parent.slug) ? { slug: parent.slug, name: parent.name ?? parent.slug, parent: parent.parent } : null;
  }

  return chain;
}

export function getProductCollectionPath(product: Product): string | null {
  const chain = getProductCollectionChain(product);
  return chain.length > 0 ? chain.map((collection) => collection.slug).join('/') : null;
}

export function buildBreadcrumbJsonLd(product: Product, siteUrl: string) {
  const collectionChain = getProductCollectionChain(product);

  const items: { name: string; url?: string }[] = [{ name: 'Главная', url: `${siteUrl}/` }];

  collectionChain.forEach((collection, index) => {
    const collectionPath = collectionChain
      .slice(0, index + 1)
      .map((item) => item.slug)
      .join('/');
    items.push({ name: collection.name, url: `${siteUrl}/collections/${collectionPath}` });
  });

  items.push({ name: product.name });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}
