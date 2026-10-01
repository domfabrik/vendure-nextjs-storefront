import { Skeleton } from '@mui/material';
import { PageContainer } from '@/shared/ui';
import { ProductGridSkeleton } from '@/shared/ui/skeletons';

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton
        variant="text"
        sx={{ width: 250, fontSize: 36, mb: 2 }}
      />
      <ProductGridSkeleton count={12} />
    </PageContainer>
  );
}
