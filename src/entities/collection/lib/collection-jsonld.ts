import type { Collection, HomepageProduct } from '@/shared/api';
import { normalizeCurrencyCode, normalizeMinorPrice } from '@/shared/lib';

export function buildCollectionBreadcrumbJsonLd(collection: Collection, siteUrl: string, slug: string) {
  const items: { name: string; url?: string }[] = [{ name: 'Главная', url: `${siteUrl}/` }];

  if (collection.parent?.slug && collection.parent.slug !== '__root_collection__') {
    items.push({ name: collection.parent.name, url: `${siteUrl}/collections/${collection.parent.slug}` });
  }

  items.push({ name: collection.name });

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

function getMinPrice(product: HomepageProduct): number | undefined {
  const p = product.priceWithTax;
  if (p.__typename === 'SinglePrice') {
    const minorPrice = normalizeMinorPrice(p.value);
    return minorPrice === undefined ? undefined : minorPrice / 100;
  }
  const min = normalizeMinorPrice(p.min);
  const max = normalizeMinorPrice(p.max);
  return min === undefined || max === undefined || min > max ? undefined : min / 100;
}

export function buildCollectionItemListJsonLd(products: HomepageProduct[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 30).map((product, index) => {
      const price = getMinPrice(product);
      const priceCurrency = normalizeCurrencyCode(product.currencyCode);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/products/${product.slug}`,
        name: product.productName,
        image: product.productAsset?.preview,
        ...(price !== undefined && priceCurrency
          ? {
              item: {
                '@type': 'Product',
                name: product.productName,
                image: product.productAsset?.preview,
                offers: {
                  '@type': 'Offer',
                  price,
                  priceCurrency,
                },
              },
            }
          : {}),
      };
    }),
  };
}
