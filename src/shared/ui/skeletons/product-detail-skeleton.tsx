import { Box, Skeleton } from '@mui/material';

export function ProductDetailSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
      }}
    >
      {/* Gallery */}
      <Box sx={{ flex: { md: '0 0 50%' }, maxWidth: { md: '50%' } }}>
        <Skeleton
          variant="rounded"
          sx={{ aspectRatio: '4 / 3', width: '100%', borderRadius: '16px' }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              width={72}
              height={72}
              sx={{ borderRadius: '10px' }}
            />
          ))}
        </Box>
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1 }}>
        <Skeleton
          variant="text"
          sx={{ fontSize: 28, width: '80%', mb: 1 }}
        />
        <Skeleton
          variant="text"
          sx={{ fontSize: 28, width: '50%', mb: 2 }}
        />

        <Skeleton
          variant="text"
          sx={{ fontSize: 22, width: '30%', mb: 3 }}
        />

        <Skeleton
          variant="rounded"
          sx={{ width: 200, height: 46, borderRadius: '10px', mb: 3 }}
        />

        {Array.from({ length: 2 }, (_, gi) => (
          <Box
            key={gi}
            sx={{ mb: 2 }}
          >
            <Skeleton
              variant="text"
              sx={{ width: 80, fontSize: 14, mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: 3 }, (_, ci) => (
                <Skeleton
                  key={ci}
                  variant="rounded"
                  width={64}
                  height={28}
                  sx={{ borderRadius: '8px' }}
                />
              ))}
            </Box>
          </Box>
        ))}

        <Box sx={{ mt: 4 }}>
          <Skeleton
            variant="text"
            sx={{ width: 120, fontSize: 20, mb: 1 }}
          />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              variant="text"
              sx={{ width: i === 3 ? '60%' : '100%' }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
