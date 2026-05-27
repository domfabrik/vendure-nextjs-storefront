import { Box, Card, Skeleton } from '@mui/material';

export function ProductCardSkeleton() {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Skeleton
        variant="rectangular"
        sx={{ aspectRatio: '3/4', width: '100%' }}
      />
      <Box sx={{ p: 1 }}>
        <Skeleton
          variant="text"
          sx={{ width: '100%', height: '310px', fontWeight: 700, lineHeight: 1.3 }}
        />
        <Skeleton
          variant="text"
          sx={{ mt: 0.5, width: '100%', lineHeight: 1.3 }}
        />
        <Skeleton
          variant="text"
          sx={{ width: '70%', lineHeight: 1.3, minHeight: '2.6em' }}
        />
      </Box>
      <Box sx={{ px: 1, pb: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Skeleton
          variant="circular"
          width={28}
          height={28}
        />
      </Box>
    </Card>
  );
}
