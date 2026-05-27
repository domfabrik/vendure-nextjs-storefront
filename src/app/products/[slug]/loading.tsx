import { Box, Skeleton } from '@mui/material';
import { ProductDetailSkeleton, ProductGridSkeleton } from '@/shared/ui/skeletons';

export default function Loading() {
  return (
    <Box>
      {/* Breadcrumbs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton
          variant="text"
          width={70}
        />
        <Skeleton
          variant="text"
          width={100}
        />
        <Skeleton
          variant="text"
          width={150}
        />
      </Box>

      <ProductDetailSkeleton />

      {/* Recommendations */}
      <Box sx={{ mt: 6 }}>
        <Skeleton
          variant="text"
          sx={{ width: 320, fontSize: '1.5rem', fontWeight: 600, mb: 2 }}
        />
        <ProductGridSkeleton count={6} />
      </Box>
    </Box>
  );
}
