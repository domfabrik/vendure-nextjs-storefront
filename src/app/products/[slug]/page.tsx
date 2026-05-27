'use server';

import { Box, Breadcrumbs, Typography } from '@mui/material';
import { routes } from '@routes';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProductsByCollection } from '@/shared/api';
import { envServer, SITE_NAME } from '@/shared/config';
import { stripHtml } from '@/shared/lib';
import { ProductCard } from '@/shared/ui/product-card';
import { ProductDetails } from './product-details';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description = product.description ? stripHtml(product.description).slice(0, 160) : `Купить ${product.name} в интернет-магазине ${SITE_NAME}`;
  const title = `${product.name} — купить в ${SITE_NAME}`;
  const canonical = `${envServer.SITE_URL}/products/${slug}`;

  const ogImage = product.featuredAsset ? `${product.featuredAsset.preview}?w=1200&h=630&format=webp` : undefined;
  const allImages = product.assets.map((a) => `${a.preview}?w=1200&h=630&format=webp`);

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
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }, ...allImages.slice(1).map((url) => ({ url, width: 1200, height: 630 }))],
      }),
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

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href={routes.home()}>Главная</NextLink>
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
