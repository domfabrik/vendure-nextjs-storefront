import { Box, Skeleton } from '@mui/material';
import { ProductGridSkeleton } from './product-grid-skeleton';

export function CollectionSectionSkeleton() {
  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton
          variant="text"
          sx={{ width: 200, fontSize: '1.5rem' }}
        />
        <Skeleton
          variant="circular"
          width={28}
          height={28}
          sx={{ ml: 1 }}
        />
      </Box>
      <ProductGridSkeleton count={6} />
    </Box>
  );
}
