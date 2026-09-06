import type { Product } from '@/shared/api';
import { normalizeCatalogBrand, normalizeCatalogStock, normalizeCurrencyCode, normalizeMinorPrice, stripHtml } from '@/shared/lib';

function buildVariantOffer(variant: Product['variants'][number], canonical: string) {
  const minorPrice = normalizeMinorPrice(variant.priceWithTax);
  const priceCurrency = normalizeCurrencyCode(variant.currencyCode);
  if (minorPrice === undefined || !priceCurrency) return null;

  const stock = normalizeCatalogStock(variant.stockLevel);
  return {
    '@type': 'Offer',
    price: minorPrice / 100,
    priceCurrency,
    url: canonical,
    ...(variant.sku && { sku: variant.sku }),
    ...(stock.schemaAvailability && { availability: stock.schemaAvailability }),
  };
}

export function buildProductJsonLd(product: Product, siteUrl: string) {
  const canonical = `${siteUrl}/products/${product.slug}`;
  const description = product.description ? stripHtml(product.description).slice(0, 5000) : product.name;
  const brand = normalizeCatalogBrand(product.customFields.vendorName);
  const offeredVariants = product.variants.flatMap((variant) => {
    const offer = buildVariantOffer(variant, canonical);
    return offer ? [{ offer, variant }] : [];
  });
  const variantOffers = offeredVariants.map((entry) => entry.offer);
  const aggregateAvailability = (() => {
    const known = offeredVariants.map(({ variant }) => normalizeCatalogStock(variant.stockLevel)).filter((stock) => stock.kind !== 'unknown');
    if (known.some((stock) => stock.purchasable)) return 'https://schema.org/InStock';
    if (known.length === offeredVariants.length && known.length > 0) return 'https://schema.org/OutOfStock';
    return undefined;
  })();
  const offers =
    variantOffers.length === 0
      ? undefined
      : {
          '@type': 'AggregateOffer',
          lowPrice: Math.min(...variantOffers.map((offer) => offer.price)),
          highPrice: Math.max(...variantOffers.map((offer) => offer.price)),
          priceCurrency: variantOffers[0].priceCurrency,
          offerCount: variantOffers.length,
          url: canonical,
          ...(aggregateAvailability && { availability: aggregateAvailability }),
          offers: variantOffers,
        };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.assets.map((a) => a.preview),
    ...(product.variants[0]?.sku && { sku: product.variants[0].sku }),
    ...(brand && { brand: { '@type': 'Brand', name: brand } }),
    ...(product.customFields.weightKg && {
      weight: {
        '@type': 'QuantitativeValue',
        value: product.customFields.weightKg,
        unitCode: 'KGM',
      },
    }),
    ...(offers && { offers }),
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
