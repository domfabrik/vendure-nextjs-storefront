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
          variant="rectangular"
          sx={{ aspectRatio: '3/4', width: '100%', borderRadius: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={64}
              height={64}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1 }}>
        {/* Title */}
        <Skeleton
          variant="text"
          sx={{ fontSize: '2.125rem', width: '80%', mb: 2 }}
        />

        {/* Price */}
        <Skeleton
          variant="text"
          sx={{ fontSize: '1.5rem', width: '30%', mb: 2 }}
        />

        {/* Stock chip */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rounded"
            width={100}
            height={24}
          />
        </Box>

        {/* Add to cart button */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rounded"
            width={180}
            height={42}
          />
        </Box>

        {/* Option groups */}
        <Box sx={{ mb: 3 }}>
          {Array.from({ length: 2 }, (_, gi) => (
            <Box
              key={gi}
              sx={{ mb: 2 }}
            >
              <Skeleton
                variant="text"
                sx={{ width: 80, fontSize: '0.875rem', mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: 3 }, (_, ci) => (
                  <Skeleton
                    key={ci}
                    variant="rounded"
                    width={60}
                    height={24}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* SKU */}
        <Skeleton
          variant="text"
          sx={{ width: '25%', fontSize: '0.875rem', mb: 3 }}
        />

        {/* Description */}
        <Box sx={{ mt: 3 }}>
          <Skeleton
            variant="text"
            sx={{ width: 120, fontSize: '1.25rem', mb: 1 }}
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
