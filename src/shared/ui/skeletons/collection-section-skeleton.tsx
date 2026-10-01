import { Box, Skeleton } from '@mui/material';
import { SectionContainer } from '@/shared/ui';

export function CollectionSectionSkeleton() {
  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
        <Skeleton
          variant="text"
          sx={{ width: 280, fontSize: 36 }}
        />
        <Skeleton
          variant="text"
          sx={{ width: 120, fontSize: 15 }}
        />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(320px, 1fr))' },
          gap: 2.5,
        }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ aspectRatio: '4 / 3', width: '100%', borderRadius: '16px' }}
          />
        ))}
      </Box>
    </SectionContainer>
  );
}
