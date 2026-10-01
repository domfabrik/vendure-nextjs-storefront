import { Box, Skeleton } from '@mui/material';
import { PageContainer } from '@/shared/ui';
import { ProductDetailSkeleton, ProductGridSkeleton } from '@/shared/ui/skeletons';

export default function Loading() {
  return (
    <PageContainer>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
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

      <Box sx={{ mt: 8 }}>
        <Skeleton
          variant="text"
          sx={{ width: 320, fontSize: 28, mb: 3 }}
        />
        <ProductGridSkeleton count={4} />
      </Box>
    </PageContainer>
  );
}
