import { Box, Button, Typography } from '@mui/material';
import { contacts } from '@routes';
import { SectionContainer } from '@/shared/ui';

export function Consultation() {
  return (
    <SectionContainer sx={{ py: 10 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          borderRadius: '20px',
          overflow: 'hidden',
          bgcolor: 'warmBg',
        }}
      >
        <Box sx={{ p: { xs: 4, md: 7 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography
            variant="h2"
            sx={{ letterSpacing: '-0.6px', lineHeight: 1.15 }}
          >
            Не знаете, что выбрать?
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ lineHeight: 1.55, color: 'primary.light' }}
          >
            Оставьте телефон — подберём мебель под размеры и стиль вашей комнаты и посчитаем доставку.
          </Typography>

          <a
            href={contacts.phoneHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography
              variant="h3"
              sx={{ color: 'text.primary', mt: 1 }}
            >
              {contacts.phone}
            </Typography>
          </a>

          <Button
            variant="contained"
            size="large"
            href={contacts.phoneHref}
            sx={{ maxWidth: 440 }}
          >
            Позвонить
          </Button>
        </Box>

        <Box sx={{ position: 'relative', minHeight: { xs: 280, md: 440 } }}>
          <img
            src="/images/home/consultation.webp"
            alt="Интерьер спальни"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>
    </SectionContainer>
  );
}
