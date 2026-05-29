import { Box, Typography } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия использования',
  description: 'Условия использования интернет-магазина DomFabrik',
};

export default function TermsPage() {
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
        Условия использования
      </Typography>

      <Typography sx={{ mb: 2 }}>Страница находится в разработке. Содержимое будет добавлено в ближайшее время.</Typography>
    </Box>
  );
}
