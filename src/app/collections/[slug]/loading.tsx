import { Box, Skeleton } from '@mui/material';
import { ProductGridSkeleton } from '@/shared/ui/skeletons';

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
          width={120}
        />
      </Box>

      {/* Title */}
      <Skeleton
        variant="text"
        sx={{ width: 250, fontSize: '1.5rem', fontWeight: 600, mb: 2 }}
      />

      <ProductGridSkeleton count={12} />
    </Box>
  );
}
