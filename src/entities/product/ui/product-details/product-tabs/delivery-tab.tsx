'use client';

import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlined from '@mui/icons-material/PaymentOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { Box, Typography } from '@mui/material';
import { contacts } from '@/shared/router';

export function DeliveryTab() {
  const cards = [
    {
      icon: <LocalShippingOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Доставка',
      text: 'Доставка по России транспортными компаниями СДЭК, Деловые Линии, ПЭК. Стоимость рассчитывается индивидуально.',
    },
    {
      icon: <PaymentOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Оплата',
      text: 'Наличные, банковская карта, безналичный расчёт. Предоплата 100%',
    },
    {
      icon: <StorefrontOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Шоурум в Туле',
      text: `${contacts.address}. ${contacts.workingHours}. Тел: ${contacts.phone}`,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
        gap: 2.5,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.title}
          sx={{
            bgcolor: 'warmBg',
            borderRadius: '16px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {card.icon}
          <Typography variant="h6">{card.title}</Typography>
          <Typography
            variant="subtitle1"
            sx={{ lineHeight: 1.6, color: 'primary.light' }}
          >
            {card.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
