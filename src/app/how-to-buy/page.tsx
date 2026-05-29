import { Box, Typography } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Как купить',
  description: 'Как купить мебель в интернет-магазине DomFabrik',
};

export default function HowToBuyPage() {
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
        Как купить
      </Typography>

      <Typography sx={{ mb: 2 }}>Страница находится в разработке. Содержимое будет добавлено в ближайшее время.</Typography>
    </Box>
  );
}
