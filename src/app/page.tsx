'use server';

import { Typography } from '@mui/material';
import { CollectionList } from '@/entities/collection';
import { NewProducts } from '@/entities/product';
import { LdScript } from '@/entities/site/index.server';
import { VendorBanner } from '@/entities/vendor';
import { getCollectionsWithProducts, getNewProducts } from '@/shared/api';

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

      <NewProducts products={newProducts} />

      <Typography
        component="h2"
        variant="h4"
        sx={{
          fontWeight: 'bold',
          mb: 2,
        }}
      >
        Наши фабрики
      </Typography>

      <VendorBanner />

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
      <CollectionList collections={collections} />
    </>
  );
}
