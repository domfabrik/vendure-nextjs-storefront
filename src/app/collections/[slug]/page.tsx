'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import { routes } from '@routes';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { buildCollectionBreadcrumbJsonLd, buildCollectionItemListJsonLd, generateCollectionMetadata } from '@/entities/collection';
import { getCollectionBySlug, getProductsByCollection } from '@/shared/api';
import { envServer } from '@/shared/config';
import { ProductCard } from '@/shared/ui/product-card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return generateCollectionMetadata(collection, slug);
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const [collection, products] = await Promise.all([getCollectionBySlug(slug), getProductsByCollection(slug)]);

  const breadcrumbJsonLd = collection ? buildCollectionBreadcrumbJsonLd(collection, envServer.SITE_URL, slug) : null;
  const itemListJsonLd = buildCollectionItemListJsonLd(products, envServer.SITE_URL);

  return (
    <Box>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href={routes.home()}>Главная</NextLink>
        <Typography color="text.primary">{collection?.name}</Typography>
      </Breadcrumbs>
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        {collection?.name}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.slug}
            index={index}
            product={product}
          />
        ))}
      </Box>
    </Box>
  );
}
