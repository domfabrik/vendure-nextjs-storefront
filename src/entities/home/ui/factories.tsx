import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { SectionContainer } from '@/shared/ui';

interface VendorLogo {
  facetValueId: string;
  name: string;
  logo: string;
  invertLogo?: boolean;
}

interface FactoriesProps {
  vendors: VendorLogo[];
}

const BRAND_FACET_ID = '2';

export function Factories({ vendors }: FactoriesProps) {
  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Box
        sx={{
          bgcolor: '#1B2B45',
          borderRadius: '20px',
          p: { xs: 4, md: '48px 56px' },
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 4,
            alignItems: 'end',
          }}
        >
          <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.15, color: '#FFFFFF' }}>
            Работаем напрямую с фабриками — без наценки посредников
          </Typography>
          <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: '#C9D1DD' }}>
            Мы заключаем прямые контракты с производителями мебели, что позволяет предложить вам фабричные цены и официальную гарантию.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(auto-fit, minmax(150px, 1fr))' },
            gap: 2,
          }}
        >
          {vendors.map((vendor) => (
            <NextLink
              key={vendor.facetValueId}
              href={routes.search({ filters: JSON.stringify({ [BRAND_FACET_ID]: [vendor.facetValueId] }) })}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  height: 96,
                  borderRadius: '12px',
                  border: '1px solid #34445E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2.25,
                  transition: 'border-color .2s',
                  '&:hover': { borderColor: '#7A8BA3' },
                }}
              >
                <img
                  src={vendor.logo}
                  alt={vendor.name}
                  style={{
                    maxHeight: 52,
                    maxWidth: '100%',
                    ...(vendor.invertLogo ? { filter: 'brightness(0) invert(1)' } : {}),
                  }}
                />
              </Box>
            </NextLink>
          ))}
        </Box>
      </Box>
    </SectionContainer>
  );
}
