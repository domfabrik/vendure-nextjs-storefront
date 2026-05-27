'use server';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { getCollectionsWithProducts } from '@/shared/api';
import { envServer, SITE_NAME } from '@/shared/config';
import { ProductCard } from '@/shared/ui/product-card';

export async function generateMetadata(): Promise<Metadata> {
  const title = `${SITE_NAME} — Элитная мебель для дома | Кухни, спальни, гостиные`;
  const description =
    'Широкий выбор дизайнерской мебели премиум-качества в магазине DomFabrik. Кухонные гарнитуры, роскошные спальные комплекты, мягкая мебель и шкафы-купе с доставкой.';
  const ogImageUrl = `${envServer.SITE_URL}/images/logo.svg`;

  return {
    title,
    description,
    alternates: { canonical: envServer.SITE_URL },
    openGraph: {
      title,
      description,
      url: envServer.SITE_URL,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'ru_RU',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `Премиальная мебель ${SITE_NAME}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

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
            <NextLink href={routes.collection(collection.slug)}>
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
