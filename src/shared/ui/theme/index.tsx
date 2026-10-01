'use client';

import { createTheme, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';

declare module '@mui/material/styles' {
  interface TypeText {
    contrast: string;
  }

  interface Palette {
    accent: { main: string };
    warmBg: string;
  }

  interface PaletteOptions {
    accent?: { main: string };
    warmBg?: string;
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
        default: '#FFFFFF',
        paper: '#ffffff',
      },
      primary: {
        main: '#1B2B45',
      },
      text: {
        primary: '#1B2B45',
        secondary: '#5A6475',
        contrast: '#ffffff',
      },
      accent: {
        main: '#96592C',
      },
      warmBg: '#F5F2EC',
    },

    typography: {
      fontFamily: 'var(--font-manrope), sans-serif',

      body1: {
        fontWeight: 400,
      },

      body2: {
        fontWeight: 400,
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
