import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { ProductCardSkeleton } from './product-card-skeleton';

interface ProductGridSkeletonProps {
  count?: number;
  columns?: Record<string, string>;
}

const defaultColumns: Record<string, string> = {
  xs: 'repeat(2, 1fr)',
  sm: 'repeat(4, 1fr)',
  md: 'repeat(6, 1fr)',
};

export function ProductGridSkeleton({ count = 6, columns = defaultColumns }: ProductGridSkeletonProps) {
  const gridTemplateColumns: SxProps<Theme> = columns;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        gap: 2,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </Box>
  );
}
