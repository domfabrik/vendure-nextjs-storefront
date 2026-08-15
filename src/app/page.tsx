'use server';

import { Masonry } from '@mui/lab';
import { Box, Typography } from '@mui/material';
import { CollectionCard } from '@/entities/collection';
import { LdScript } from '@/entities/site';
import { getCollectionsWithProducts, getNewProducts } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';

export default async function Page() {
  const [collections, newProducts] = await Promise.all([getCollectionsWithProducts(6), getNewProducts(2)]);

  return (
    <>
      <LdScript collections={collections} />

      <Typography
        component="h2"
        variant="h4"
        sx={{
          fontWeight: 'bold',
          mb: 2,
        }}
      >
        Новинки
      </Typography>

      <Box
        sx={{
          overflowX: 'auto',
          pb: 2,
          mb: 4,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${newProducts.length}, 1fr)`,
            gap: 2,
            width: {
              xs: `calc((100% / 2) * ${newProducts.length})`,
              sm: `calc((100% / 3) * ${newProducts.length})`,
              md: `calc((100% / 3) * ${newProducts.length})`,
              lg: `calc((100% / 4) * ${newProducts.length})`,
            },
          }}
        >
          {newProducts.map((product) => (
            <Box
              key={product.slug}
              sx={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} />
            </Box>
          ))}
        </Box>
      </Box>

      <Typography
        component="h2"
        variant="h4"
        sx={{
          fontWeight: 'bold',
          mb: 4,
        }}
      >
        Категории
      </Typography>
      <Masonry
        columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
        spacing={3}
        sx={{ width: 'auto', minWidth: '100%' }}
      >
        {collections.map((collection) => (
          <CollectionCard
            key={collection.slug}
            collection={collection}
          />
        ))}
      </Masonry>
    </>
  );
}
