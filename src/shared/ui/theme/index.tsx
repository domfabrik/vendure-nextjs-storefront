'use client';

import { createTheme, ThemeProvider } from '@mui/material';
import { PropsWithChildren } from 'react';

declare module '@mui/material/styles' {
  interface TypeText {
    contrast: string;
    muted: string;
    hint: string;
  }

  interface Palette {
    accent: { main: string; dark: string; light: string };
    warmBg: string;
    border: { main: string; light: string; dark: string };
    neutral: string;
    inputBg: string;
    footer: { text: string; textSubdued: string; textLight: string; border: string; hoverBorder: string };
  }

  interface PaletteOptions {
    accent?: { main: string; dark?: string; light?: string };
    warmBg?: string;
    border?: { main: string; light?: string; dark?: string };
    neutral?: string;
    inputBg?: string;
    footer?: { text: string; textSubdued?: string; textLight?: string; border?: string; hoverBorder?: string };
  }

  interface TypographyVariants {
    price: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    price?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    price: true;
  }

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
        dark: '#152236',
        light: '#343E50',
      },
      text: {
        primary: '#1B2B45',
        secondary: '#5A6475',
        contrast: '#ffffff',
        muted: '#6B7586',
        hint: '#8B9099',
      },
      accent: {
        main: '#96592C',
        dark: '#7A4520',
        light: '#F6ECE3',
      },
      warmBg: '#F5F2EC',
      border: {
        main: '#E6E2DB',
        light: '#EFEBE5',
        dark: '#D9D4CC',
      },
      neutral: '#F3F1EE',
      inputBg: '#FAF9F7',
      success: {
        main: '#2E7D32',
        light: '#E7F3EA',
      },
      error: {
        main: '#C62828',
        light: '#FDEAEA',
      },
      footer: {
        text: '#C9D1DD',
        textSubdued: '#9AA6B8',
        textLight: '#E8ECF2',
        border: '#34445E',
        hoverBorder: '#7A8BA3',
      },
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

      allVariants: {
        color: '#1B2B45',
      },

      h1: {
        fontWeight: 800,
        fontSize: 34,
        '@media (min-width:900px)': {
          fontSize: 52,
        },
      },

      h2: {
        fontWeight: 800,
        fontSize: 28,
        '@media (min-width:900px)': {
          fontSize: 36,
        },
      },

      h3: {
        fontWeight: 800,
        fontSize: 24,
        '@media (min-width:900px)': {
          fontSize: 28,
        },
      },

      h4: {
        fontWeight: 800,
        fontSize: 22,
        '@media (min-width:900px)': {
          fontSize: 28,
        },
      },

      h5: {
        fontWeight: 700,
        fontSize: 20,
      },

      h6: {
        fontWeight: 700,
        fontSize: 18,
      },

      subtitle1: {
        fontWeight: 400,
        fontSize: 15,
        '@media (min-width:900px)': {
          fontSize: 17,
        },
      },

      subtitle2: {
        fontWeight: 600,
        fontSize: 15,
      },

      body1: {
        fontWeight: 400,
        fontSize: 16,
      },

      body2: {
        fontWeight: 400,
        fontSize: 14,
      },

      caption: {
        fontWeight: 400,
        fontSize: 12,
      },

      overline: {
        fontWeight: 400,
        fontSize: 13,
        textTransform: 'none',
      },

      button: {
        textTransform: 'none',
      },

      price: {
        fontWeight: 800,
        fontSize: 21,
      },
    },
  });

  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
