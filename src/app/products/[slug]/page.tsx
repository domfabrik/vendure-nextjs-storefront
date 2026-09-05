'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import { routes } from '@routes';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetails, ProductList } from '@/entities/product';
import { buildBreadcrumbJsonLd, buildProductJsonLd, generateProductMetadata } from '@/entities/product/index.server';
import { ProductDetailEvent } from '@/features/metrika';
import { getProductBySlug, getProductsByCollection } from '@/shared/api';
import { envServer } from '@/shared/config/index.server';
import { normalizeCurrencyCode, normalizeMinorPrice, serializeJsonLd } from '@/shared/lib';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return generateProductMetadata(product);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relatedCollectionSlug = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search')?.slug;
  const alsoBought = relatedCollectionSlug ? (await getProductsByCollection(relatedCollectionSlug, 12)).filter((p) => p.slug !== slug) : [];

  const collection = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search');
  const collectionHref = collection ? routes.collection(collection.slug) : null;

  const productJsonLd = buildProductJsonLd(product, envServer.SITE_URL);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, envServer.SITE_URL);
  const initialVariant = product.variants[0];
  const initialPrice = normalizeMinorPrice(initialVariant?.priceWithTax);
  const initialCurrency = normalizeCurrencyCode(initialVariant?.currencyCode);

  return (
    <Box>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href={routes.home()}>Главная</NextLink>
        {collection && collectionHref && <NextLink href={collectionHref}>{collection.name}</NextLink>}
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      {initialPrice !== undefined && initialCurrency === 'RUB' && (
        <ProductDetailEvent
          id={product.id}
          name={product.name}
          price={initialPrice}
          category={collection?.name}
          variant={initialVariant?.name}
        />
      )}
      <ProductDetails product={product} />

      {/* Also bought */}
      {alsoBought.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Также вам может быть интересно
          </Typography>

          <ProductList products={alsoBought} />
        </Box>
      )}
    </Box>
  );
}
