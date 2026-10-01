import { Box, Skeleton } from '@mui/material';
import { SectionContainer } from '@/shared/ui';
import { ProductCardSkeleton } from '@/shared/ui/skeletons';

export default function Loading() {
  return (
    <>
      {/* Hero */}
      <SectionContainer sx={{ pt: 5 }}>
        <Skeleton
          variant="rounded"
          sx={{ width: '100%', aspectRatio: '2.5 / 1', borderRadius: '20px' }}
        />
      </SectionContainer>

      {/* Мебель по комнатам */}
      <SectionContainer sx={{ pt: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
          <Skeleton
            variant="text"
            sx={{ width: 300, fontSize: 36 }}
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

      {/* Новинки */}
      <SectionContainer sx={{ pt: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
          <Skeleton
            variant="text"
            sx={{ width: 180, fontSize: 36 }}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </Box>
      </SectionContainer>

      {/* Что ищете */}
      <SectionContainer sx={{ pt: 10, pb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
          <Skeleton
            variant="text"
            sx={{ width: 200, fontSize: 36 }}
          />
          <Skeleton
            variant="text"
            sx={{ width: 130, fontSize: 15 }}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(auto-fit, minmax(170px, 1fr))' },
            gap: 2,
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              sx={{ height: 170, borderRadius: '14px' }}
            />
          ))}
        </Box>
      </SectionContainer>
    </>
  );
}
