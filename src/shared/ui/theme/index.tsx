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

    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
          },
          contained: {
            height: 46,
            '&:hover': {
              opacity: 0.9,
              backgroundColor: '#1B2B45',
              color: '#FFFFFF',
            },
          },
          outlined: {
            height: 46,
            borderWidth: '1.5px',
            borderColor: '#1B2B45',
            '&:hover': {
              borderWidth: '1.5px',
              borderColor: '#1B2B45',
              backgroundColor: 'rgba(27, 43, 69, 0.08)',
            },
          },
          sizeLarge: {
            height: 54,
            borderRadius: 12,
            fontSize: 16,
            paddingLeft: 28,
            paddingRight: 28,
          },
        },
      },
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
