'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import { routes } from '@routes';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { getCollectionBySlug, getProductsByCollection } from '@/shared/api';
import { envServer, SITE_NAME } from '@/shared/config';
import { stripHtml } from '@/shared/lib';
import { ProductCard } from '@/shared/ui/product-card';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  const title = `${collection.name} — каталог мебели ${SITE_NAME}`;
  const description = collection.description ? stripHtml(collection.description).slice(0, 160) : `${collection.name} — широкий выбор мебели в каталоге ${SITE_NAME}`;
  const canonical = `${envServer.SITE_URL}/collections/${slug}`;

  const ogImage = collection.featuredAsset ? `${collection.featuredAsset.preview}?w=1200&h=630&format=webp` : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'ru_RU',
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: collection.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  const [collection, products] = await Promise.all([getCollectionBySlug(slug), getProductsByCollection(slug)]);

  return (
    <Box>
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
