'use client';

import { Box, CardMedia } from '@mui/material';
import { useState } from 'react';
import type { Asset } from '@/shared/api';

interface ProductGalleryProps {
  images: Asset[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (!images.length) return null;

  return (
    <Box>
      <CardMedia
        component="img"
        image={current?.preview}
        alt={name}
        sx={{
          width: '100%',
          objectFit: 'contain',
          borderRadius: 2,
          mb: 2,
        }}
      />
      {images.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
          {images.map((img, i) => (
            <Box
              key={img.source}
              onClick={() => setSelected(i)}
              sx={{
                width: 64,
                height: 64,
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: 2,
                borderColor: i === selected ? 'primary.main' : 'transparent',
                opacity: i === selected ? 1 : 0.6,
                transition: 'all 0.2s',
                '&:hover': { opacity: 1 },
              }}
            >
              <CardMedia
                component="img"
                image={img.preview}
                alt={`${name} ${i + 1}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
