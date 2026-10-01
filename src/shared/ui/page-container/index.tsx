import { Box } from '@mui/material';
import { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        maxWidth: 1280,
        mx: 'auto',
        px: { xs: 1, sm: 4 },
        py: 4,
      }}
    >
      {children}
    </Box>
  );
}
