import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3.5 }}>
        <Typography
          variant="h2"
          sx={{ letterSpacing: '-0.6px', m: 0 }}
        >
          Что ищете?
        </Typography>
        <NextLink
          href={routes.catalog()}
          aria-label="Все категории"
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              width: 40,
              height: 40,
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: 'primary.main',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.main', color: 'text.contrast' },
              transition: 'all .2s',
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography
            variant="subtitle2"
            sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.primary', '&:hover': { color: 'accent.main' } }}
          >
            Все категории →
          </Typography>
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
                  bgcolor: 'warmBg',
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
                <Typography
                  variant="subtitle2"
                  sx={{ color: 'text.primary' }}
                >
                  {collection.name}
                </Typography>
              </Box>
            </NextLink>
          );
        })}
      </Box>
    </SectionContainer>
  );
}
