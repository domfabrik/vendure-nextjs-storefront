'use client';

import { createTheme, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';

export function Theme(props: PropsWithChildren) {
  const theme = createTheme({
    cssVariables: true,

    palette: {
      background: {
        default: '#f9f8f6',
        paper: '#ffffff',
      },
      primary: {
        main: '#1B2B45',
      },
      text: {
        primary: '#1B2B45',
      },
    },

    typography: {
      fontFamily: 'var(--font-open-sans), sans-serif',

      allVariants: {
        color: '#1B2B45',
      },

      button: {
        textTransform: 'none',
      },
    },
  });

  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
