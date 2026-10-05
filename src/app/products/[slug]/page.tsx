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
import { observeCatalogStage, reportCatalogFailure } from '@/shared/api/index.server';
import { envServer } from '@/shared/config/index.server';
import { normalizeCurrencyCode, normalizeMinorPrice, serializeJsonLd } from '@/shared/lib';
import { PageContainer } from '@/shared/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await observeCatalogStage('metadata', 'GetProductBySlug', () => getProductBySlug(slug));
  if (!product) notFound();

  return generateProductMetadata(product);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const product = await observeCatalogStage('product', 'GetProductBySlug', () => getProductBySlug(slug));
  if (!product) notFound();

  const relatedCollectionSlug = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search')?.slug;
  // Recommendations are optional; their API failure must not discard a loaded product.
  const alsoBought = relatedCollectionSlug
    ? await observeCatalogStage('recommendations', 'SearchCollectionProducts', () => getProductsByCollection(relatedCollectionSlug, 12, 'recommendations'))
        .then((products) => products.filter((p) => p.slug !== slug))
        .catch((error: unknown) => {
          reportCatalogFailure('SearchCollectionProducts', null, error);
          return [];
        })
    : [];

  const collection = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search');
  const collectionHref = collection ? routes.collection(collection.slug) : null;

  const productJsonLd = buildProductJsonLd(product, envServer.SITE_URL);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, envServer.SITE_URL);
  const requestedVariantId = typeof searchParams.variant === 'string' ? searchParams.variant : undefined;
  const initialVariant = product.variants.find((variant) => variant.id === requestedVariantId) ?? product.variants[0];
  const initialPrice = normalizeMinorPrice(initialVariant?.priceWithTax);
  const initialCurrency = normalizeCurrencyCode(initialVariant?.currencyCode);

  return (
    <PageContainer>
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
      <ProductDetails
        key={`${product.id}:${initialVariant?.id ?? ''}`}
        product={product}
        initialVariantId={initialVariant?.id}
      />

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
    </PageContainer>
  );
}
