'use client';

import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import type { Asset } from '@/shared/api';

interface ProductGalleryProps {
  images: Asset[];
  name: string;
  discountPercent?: number;
}

export function ProductGallery({ images, name, discountPercent }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (!images.length) return null;

  const showBadge = typeof discountPercent === 'number' && discountPercent > 0;

  return (
    <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '4 / 3',
          bgcolor: '#F3F1EE',
          borderRadius: '20px',
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <img
          src={current?.preview}
          alt={name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
          }}
        />
        {showBadge && (
          <Typography
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: '#96592C',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              px: 1.5,
              py: 0.75,
              borderRadius: '8px',
              lineHeight: 1,
            }}
          >
            −{discountPercent}%
          </Typography>
        )}
      </Box>

      {images.length > 1 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1.5,
          }}
        >
          {images.map((img, i) => (
            <Box
              key={img.source}
              onClick={() => setSelected(i)}
              sx={{
                aspectRatio: '4 / 3',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: i === selected ? '#1B2B45' : 'transparent',
                bgcolor: '#F3F1EE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: i === selected ? '#1B2B45' : '#C8C3BA' },
              }}
            >
              <img
                src={img.preview}
                alt={`${name} ${i + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
