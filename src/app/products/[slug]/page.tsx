'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProductsByCollection } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';
import { ProductDetails } from './product-details';

interface PageProps {
  params: Promise<{ slug: string }>;
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
      ? `/collections/${collection.parent.slug}/${collection.slug}`
      : `/collections/${collection.slug}`
    : null;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href="/">Главная</NextLink>
        {collection && collectionHref && <NextLink href={collectionHref}>{collection.name}</NextLink>}
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

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
            {alsoBought.map((p) => (
              <ProductCard
                key={p.slug}
                product={p}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
