import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import type { CollectionTile } from '@/shared/model';
import { SectionContainer } from '@/shared/ui';

interface ProductTypesProps {
  collections: CollectionTile[];
}

export function ProductTypes({ collections }: ProductTypesProps) {
  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 3.5 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.6px', m: 0 }}>Что ищете?</Typography>
        <NextLink
          href={routes.catalog()}
          style={{ textDecoration: 'none' }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1B2B45', '&:hover': { color: '#96592C' } }}>Все категории →</Typography>
        </NextLink>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(auto-fit, minmax(170px, 1fr))' },
          gap: 2,
        }}
      >
        {collections.map((collection) => {
          const imageUrl = collection.featuredAsset?.preview ? `${collection.featuredAsset.preview}?w=220&h=220&format=webp` : null;

          return (
            <NextLink
              key={collection.id}
              href={routes.collection(collection.slug)}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 2.5,
                  borderRadius: '14px',
                  bgcolor: '#F5F2EC',
                  '&:hover': { opacity: 0.85 },
                  transition: 'opacity .2s',
                }}
              >
                <Box sx={{ height: 110, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={collection.name}
                      loading="lazy"
                      style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1B2B45' }}>{collection.name}</Typography>
              </Box>
            </NextLink>
          );
        })}
      </Box>
    </SectionContainer>
  );
}
