'use client';

import { createTheme, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';

declare module '@mui/material/styles' {
  interface TypeText {
    contrast: string;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsColorOverrides {
    textContrast: true;
  }
}

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
        contrast: '#ffffff',
      },
    },

    typography: {
      fontFamily: 'var(--font-geist-sans), sans-serif',

      body1: {
        fontWeight: 300,
      },

      body2: {
        fontWeight: 300,
      },

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
