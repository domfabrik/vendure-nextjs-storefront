'use client';

import MuiGlobalStyles from '@mui/material/GlobalStyles';

export function GlobalStyles() {
  return (
    <MuiGlobalStyles
      styles={({ palette }) => ({
        html: {
          minHeight: '100%',
        },
        body: {
          background: palette.background.default,
          fontSmooth: 'antialiased',
          minHeight: '100%',
          margin: 0,
          padding: 0,
        },
        a: {
          textDecoration: 'none',
          color: palette.primary.main,
        },
      })}
    />
  );
}
