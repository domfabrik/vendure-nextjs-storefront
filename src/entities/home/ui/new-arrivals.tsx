'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import type { HomepageProduct } from '@/shared/model';
import { SectionContainer } from '@/shared/ui';
import { ProductCard } from '@/shared/ui/product-card';

interface NewArrivalsProps {
  products: HomepageProduct[];
}

const PAGE_SIZE = 4;

export function NewArrivals({ products }: NewArrivalsProps) {
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  const visibleProducts = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3.5 }}>
        <Typography
          variant="h2"
          sx={{ letterSpacing: '-0.6px', m: 0 }}
        >
          Новинки
        </Typography>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              onClick={goPrev}
              sx={(t) => ({
                width: { xs: 40, md: 46 },
                height: { xs: 40, md: 46 },
                borderRadius: '23px',
                border: '1.5px solid',
                borderColor: page === 0 ? t.palette.border.dark : t.palette.primary.main,
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: page === 0 ? t.palette.border.dark : t.palette.primary.main,
                cursor: page === 0 ? 'default' : 'pointer',
                userSelect: 'none',
              })}
            >
              <ChevronLeftIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box
              onClick={goNext}
              sx={(t) => ({
                width: { xs: 40, md: 46 },
                height: { xs: 40, md: 46 },
                borderRadius: '23px',
                border: '1.5px solid',
                borderColor: t.palette.primary.main,
                bgcolor: page === totalPages - 1 ? 'background.default' : t.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: page === totalPages - 1 ? t.palette.border.dark : t.palette.text.contrast,
                cursor: page === totalPages - 1 ? 'default' : 'pointer',
                userSelect: 'none',
              })}
            >
              <ChevronRightIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.productVariantId}
            product={product}
          />
        ))}
      </Box>
    </SectionContainer>
  );
}
