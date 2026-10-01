import { Box, Skeleton } from '@mui/material';

export function ProductCardSkeleton() {
  return (
    <Box
      sx={{
        border: '1px solid #E6E2DB',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <Skeleton
        variant="rectangular"
        sx={{ aspectRatio: '4 / 3', width: '100%' }}
      />
      <Box sx={{ p: 1.5 }}>
        <Skeleton
          variant="text"
          sx={{ width: '85%', fontSize: 16 }}
        />
        <Skeleton
          variant="text"
          sx={{ width: '55%', fontSize: 16 }}
        />
        <Skeleton
          variant="text"
          sx={{ width: '40%', fontSize: 22, mt: 1 }}
        />
      </Box>
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Skeleton
          variant="rounded"
          sx={{ width: '100%', height: 46, borderRadius: '10px' }}
        />
      </Box>
    </Box>
  );
}
