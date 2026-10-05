import { Box, Button, Typography } from '@mui/material';
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
          bgcolor: 'warmBg',
        }}
      >
        <Box sx={{ p: { xs: 4, md: '64px 56px' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'accent.main',
            }}
          >
            Напрямую от 5 фабрик
          </Typography>

          <Typography
            variant="h1"
            sx={{
              lineHeight: 1.08,
              letterSpacing: '-1.2px',
              m: 0,
            }}
          >
            Мебель для всего дома по ценам производителя
          </Typography>

          <Typography
            variant="h6"
            sx={{ fontWeight: 400, lineHeight: 1.55, color: 'primary.light', maxWidth: 480 }}
          >
            Спальни, гостиные, кухни и мягкая мебель от Fortuna Home, Арида, Эра, Nartmi и ФСМ. Привезём в любой город России.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <NextLink
              href={routes.catalog()}
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="contained"
                size="large"
              >
                Перейти в каталог
              </Button>
            </NextLink>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', minHeight: { xs: 280, md: 520 } }}>
          <img
            src="/images/home/hero.webp"
            alt="Интерьер шоурума"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>
    </SectionContainer>
  );
}
