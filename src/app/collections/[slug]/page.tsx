'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import NextLink from 'next/link';
import { getCollectionBySlug, getProductsByCollection } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const [collection, products] = await Promise.all([getCollectionBySlug(slug), getProductsByCollection(slug)]);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href="/">Главная</NextLink>
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
        {products.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
          />
        ))}
      </Box>
    </Box>
  );
}
