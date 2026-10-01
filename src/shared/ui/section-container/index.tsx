import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { PropsWithChildren } from 'react';

interface SectionContainerProps extends PropsWithChildren {
  sx?: SxProps<Theme>;
}

export function SectionContainer({ children, sx }: SectionContainerProps) {
  return (
    <Box
      sx={{
        maxWidth: 1280,
        mx: 'auto',
        px: { xs: 1, sm: 4 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
