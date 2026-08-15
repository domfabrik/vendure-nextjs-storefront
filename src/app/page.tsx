'use server';

import { Masonry } from '@mui/lab';
import { Typography } from '@mui/material';
import { CollectionCard } from '@/entities/collection';
import { LdScript } from '@/entities/site';
import { getCollectionsWithProducts } from '@/shared/api';

export default async function Page() {
  const collections = await getCollectionsWithProducts(6);

  return (
    <>
      <LdScript collections={collections} />

      <Typography
        component="h2"
        variant="h4"
        sx={{
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
