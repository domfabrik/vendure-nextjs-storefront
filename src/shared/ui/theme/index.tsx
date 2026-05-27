'use client';

import { createTheme, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';

export function Theme(props: PropsWithChildren) {
  const theme = createTheme({
    cssVariables: true,

    typography: {
      fontFamily: 'var(--font-open-sans), sans-serif',
    },

    palette: {
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
    },
  });

  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
