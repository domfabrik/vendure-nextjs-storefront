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
          width={60}
        />
      </Box>

      {/* Title */}
      <Skeleton
        variant="text"
        sx={{ width: 350, fontSize: '2.125rem', fontWeight: 700, mb: 1 }}
      />

      {/* Found count */}
      <Skeleton
        variant="text"
        sx={{ width: 100, fontSize: '0.875rem', mb: 3 }}
      />

      {/* Toolbar: filters button + sort select */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Skeleton
          variant="rounded"
          width={120}
          height={36}
        />
        <Skeleton
          variant="rounded"
          width={200}
          height={36}
        />
      </Box>

      <ProductGridSkeleton
        count={12}
        columns={{
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(6, 1fr)',
        }}
      />
    </Box>
  );
}
