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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return generateProductMetadata(product);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  const relatedCollectionSlug = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search')?.slug;
  const alsoBought = relatedCollectionSlug ? (await getProductsByCollection(relatedCollectionSlug, 12)).filter((p) => p.slug !== slug) : [];

  const collection = product.collections.find((c) => c.slug !== 'all' && c.slug !== 'search');
  const collectionHref = collection
    ? collection.parent?.slug && collection.parent.slug !== '__root_collection__'
      ? routes.collection(`${collection.parent.slug}/${collection.slug}`)
      : routes.collection(collection.slug)
    : null;

  const productJsonLd = buildProductJsonLd(product, envServer.SITE_URL);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product, envServer.SITE_URL);

  return (
    <Box>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href={routes.home()}>Главная</NextLink>
        {collection && collectionHref && <NextLink href={collectionHref}>{collection.name}</NextLink>}
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <ProductDetailEvent
        id={product.id}
        name={product.name}
        price={product.variants[0]?.priceWithTax ?? 0}
        category={collection?.name}
        variant={product.variants[0]?.name}
      />
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
