import type { Collection, HomepageProduct } from '@/shared/api';

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

function getMinPrice(product: HomepageProduct): number {
  const p = product.priceWithTax;
  if (p.__typename === 'SinglePrice') return (p.value ?? 0) / 100;
  return (p.min ?? 0) / 100;
}

export function buildCollectionItemListJsonLd(products: HomepageProduct[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 30).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/products/${product.slug}`,
      name: product.productName,
      image: product.productAsset?.preview,
      ...(getMinPrice(product) > 0 && {
        item: {
          '@type': 'Product',
          name: product.productName,
          image: product.productAsset?.preview,
          offers: {
            '@type': 'Offer',
            price: getMinPrice(product),
            priceCurrency: 'RUB',
            availability: 'https://schema.org/InStock',
          },
        },
      }),
    })),
  };
}
