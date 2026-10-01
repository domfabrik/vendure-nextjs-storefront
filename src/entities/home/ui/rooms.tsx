import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import type { CollectionTile } from '@/shared/model';
import { SectionContainer } from '@/shared/ui';

interface RoomTile extends CollectionTile {
  image: string | null;
}

interface RoomsProps {
  collections: RoomTile[];
}

export function Rooms({ collections }: RoomsProps) {
  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 3.5 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.6px', m: 0 }}>Мебель по комнатам</Typography>
        <NextLink
          href={routes.catalog()}
          style={{ textDecoration: 'none' }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#1B2B45', '&:hover': { color: '#96592C' } }}>Весь каталог →</Typography>
        </NextLink>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(320px, 1fr))' },
          gap: 2.5,
        }}
      >
        {collections.map((collection) => (
          <NextLink
            key={collection.id}
            href={routes.collection(collection.slug)}
            style={{ textDecoration: 'none' }}
          >
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '4 / 3',
                borderRadius: '16px',
                overflow: 'hidden',
                bgcolor: '#F3F1EE',
                '& img': { transform: 'scale(1.02)', transition: 'transform .4s ease' },
                '&:hover img': { transform: 'scale(1.08)' },
              }}
            >
              {collection.image && (
                <img
                  src={collection.image}
                  alt={collection.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
              <Box
                sx={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  right: 16,
                  bgcolor: '#FFFFFF',
                  borderRadius: '12px',
                  px: 2.25,
                  py: 1.75,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#1B2B45' }}>{collection.name}</Typography>
              </Box>
            </Box>
          </NextLink>
        ))}
      </Box>
    </SectionContainer>
  );
}
