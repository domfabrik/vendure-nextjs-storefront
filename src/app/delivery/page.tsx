import { Box, Typography } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Информация о доставке товаров интернет-магазина DomFabrik',
};

export default function DeliveryPage() {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 4,
        borderRadius: 2,
        my: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}
      >
        Доставка
      </Typography>

      <Typography sx={{ mb: 2 }}>Страница находится в разработке. Содержимое будет добавлено в ближайшее время.</Typography>
    </Box>
  );
}
