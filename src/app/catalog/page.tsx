'use server';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import { Metadata } from 'next';
import NextLink from 'next/link';
import { getAllCollections } from '@/shared/api';
import { COLLECTION_IMAGES, SITE_NAME } from '@/shared/config';
import { arrayToTree } from '@/shared/lib';
import { PageContainer } from '@/shared/ui';

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Каталог | ${SITE_NAME}` };
}

export default async function CatalogPage() {
  const collections = await getAllCollections();
  const tree = arrayToTree(collections);

  return (
    <PageContainer>
      <Typography
        variant="h2"
        sx={{ letterSpacing: '-0.6px', mb: 4 }}
      >
        Каталог
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {tree.children.map((node) => {
          const imageUrl = COLLECTION_IMAGES[node.slug] ?? null;

          return (
            <Box key={node.id}>
              <NextLink
                href={routes.collection(node.slug)}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    bgcolor: 'neutral',
                    mb: 2,
                  }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={node.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.02)' }}
                    />
                  )}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ mb: 1 }}
                >
                  {node.name}
                </Typography>
              </NextLink>

              {node.children.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {node.children.map((child) => (
                    <NextLink
                      key={child.id}
                      href={routes.collection(child.slug)}
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', '&:hover': { color: 'accent.main' } }}
                      >
                        {child.name}
                      </Typography>
                    </NextLink>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </PageContainer>
  );
}
