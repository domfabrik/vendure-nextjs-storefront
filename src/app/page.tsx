'use server';

import { Box, Typography } from '@mui/material';
import NextLink from 'next/link';
import { getCollectionsWithProducts } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';

export default async function Page() {
  const collections = await getCollectionsWithProducts(6);

  return (
    <>
      {collections.map((collection) => (
        <Box
          key={collection.slug}
          sx={{ mb: 5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 600 }}
            >
              {collection.name}
            </Typography>
            <NextLink href={`/collections/${collection.slug}`}>
              <Typography variant="body2">Смотреть&nbsp;все</Typography>
            </NextLink>
          </Box>
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
            {collection.products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
              />
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}
