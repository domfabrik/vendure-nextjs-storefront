'use server';

import ArrowRight from '@mui/icons-material/NavigateNext';
import { Box, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { buildHomepageItemListJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/entities/site';
import { getCollectionsWithProducts } from '@/shared/api';
import { envServer } from '@/shared/config';
import { ProductCard } from '@/shared/ui/product-card';

export default async function Page() {
  const collections = await getCollectionsWithProducts(6);

  const organizationJsonLd = buildOrganizationJsonLd(envServer.SITE_URL);
  const webSiteJsonLd = buildWebSiteJsonLd(envServer.SITE_URL);
  const itemListJsonLd = buildHomepageItemListJsonLd(collections, envServer.SITE_URL);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {collections.map((collection) => (
        <Box
          key={collection.slug}
          sx={{ mb: 5 }}
        >
          <NextLink href={routes.collection(collection.slug)}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 500, mb: 2 }}
            >
              {collection.name}

              <IconButton
                aria-label="Перейти в раздел"
                sx={{ ml: 1 }}
              >
                <ArrowRight />
              </IconButton>
            </Typography>
          </NextLink>
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
            {collection.products.map((product, index) => (
              <ProductCard
                key={product.slug}
                index={index}
                product={product}
              />
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}
