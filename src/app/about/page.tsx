import { Box, Typography } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'О компании',
  description: 'О компании DomFabrik — интернет-магазин мебели',
};

export default function AboutPage() {
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
        О компании
      </Typography>

      <Typography sx={{ mb: 2 }}>Страница находится в разработке. Содержимое будет добавлено в ближайшее время.</Typography>
    </Box>
  );
}
