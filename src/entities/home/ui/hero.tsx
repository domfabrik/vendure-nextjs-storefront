import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { SectionContainer } from '@/shared/ui';

export function Hero() {
  return (
    <SectionContainer sx={{ pt: '28px' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          borderRadius: '20px',
          overflow: 'hidden',
          bgcolor: '#F5F2EC',
        }}
      >
        <Box sx={{ p: { xs: 4, md: '64px 56px' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#96592C',
            }}
          >
            Напрямую от 5 фабрик
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 34, md: 52 },
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: '-1.2px',
              m: 0,
            }}
          >
            Мебель для всего дома по ценам производителя
          </Typography>

          <Typography sx={{ fontSize: 18, lineHeight: 1.55, color: '#4A5466', maxWidth: 480 }}>
            Спальни, гостиные, кухни и мягкая мебель от Fortuna Home, Арида, Эра, Nartmi и ФСМ. Привезём и соберём.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <NextLink
              href={routes.catalog()}
              style={{
                background: '#1B2B45',
                color: '#FFFFFF',
                height: 54,
                padding: '0 28px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}
            >
              Перейти в каталог
            </NextLink>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', minHeight: { xs: 280, md: 520 } }}>
          <img
            src="/images/home/hero.jpg"
            alt="Интерьер шоурума"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>
    </SectionContainer>
  );
}
