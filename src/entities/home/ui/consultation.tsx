import { Box, Typography } from '@mui/material';
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
          bgcolor: '#F5F2EC',
        }}
      >
        <Box sx={{ p: { xs: 4, md: 7 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.15 }}>Не знаете, что выбрать?</Typography>
          <Typography sx={{ fontSize: 17, lineHeight: 1.55, color: '#4A5466' }}>
            Оставьте телефон — подберём мебель под размеры и стиль вашей комнаты и посчитаем доставку.
          </Typography>

          <a
            href={contacts.phoneHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#1B2B45', mt: 1 }}>{contacts.phone}</Typography>
          </a>

          <a
            href={contacts.phoneHref}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 54,
              maxWidth: 440,
              border: 0,
              borderRadius: 12,
              background: '#1B2B45',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            Позвонить
          </a>
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
