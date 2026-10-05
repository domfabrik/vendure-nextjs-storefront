import { Box, Typography } from '@mui/material';
import { SectionContainer } from '@/shared/ui';

const steps = [
  {
    n: '01',
    title: 'Выбираете мебель',
    text: 'На сайте или с помощью консультанта по телефону и в мессенджерах.',
  },
  {
    n: '02',
    title: 'Подтверждаем заказ',
    text: 'Уточняем размеры, цвет и наличие на фабрике.',
  },
  {
    n: '03',
    title: 'Оплата',
    text: 'Предоплата 100% после подтверждения заказа.',
  },
  {
    n: '04',
    title: 'Доставляем',
    text: 'Доставка до двери по всей России.',
  },
];

export function HowWeWork() {
  return (
    <SectionContainer sx={{ pt: 10 }}>
      <Typography
        variant="h2"
        sx={{ letterSpacing: '-0.6px', mb: 3.5 }}
      >
        Как мы работаем
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
          gap: 2.5,
        }}
      >
        {steps.map((step) => (
          <Box
            key={step.n}
            sx={{
              p: '28px 24px',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'border.main',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 40, fontWeight: 800, color: 'accent.main', lineHeight: 1 }}>{step.n}</Typography>
            <Typography variant="h6">{step.title}</Typography>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 400, color: 'text.secondary', lineHeight: 1.5 }}
            >
              {step.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </SectionContainer>
  );
}
