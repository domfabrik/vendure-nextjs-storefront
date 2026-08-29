import type { Product } from '@/shared/api';
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

export function buildBreadcrumbJsonLd(product: Product, siteUrl: string) {
  const collection = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search');

  const items: { name: string; url?: string }[] = [{ name: 'Главная', url: `${siteUrl}/` }];

  if (collection) {
    items.push({ name: collection.name, url: `${siteUrl}/collections/${collection.slug}` });
  }

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
