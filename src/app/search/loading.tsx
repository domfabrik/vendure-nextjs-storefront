import { Box, Skeleton } from '@mui/material';
import { PageContainer } from '@/shared/ui';
import { ProductGridSkeleton } from '@/shared/ui/skeletons';

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton
        variant="text"
        sx={{ width: 350, fontSize: 36, mb: 1 }}
      />

      <Skeleton
        variant="text"
        sx={{ width: 100, fontSize: 14, mb: 3 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Skeleton
          variant="rounded"
          sx={{ width: 120, height: 46, borderRadius: '10px' }}
        />
        <Skeleton
          variant="rounded"
          sx={{ width: 200, height: 46, borderRadius: '10px' }}
        />
      </Box>

      <ProductGridSkeleton count={12} />
    </PageContainer>
  );
}
