'use client';

import MuiGlobalStyles from '@mui/material/GlobalStyles';

export function GlobalStyles() {
  return (
    <MuiGlobalStyles
      styles={({ palette }) => ({
        html: {
          height: '100%',
          overflow: 'auto',
        },
        body: {
          background: palette.background.default,
          fontSmooth: 'antialiased',
          height: '100%',
          margin: 0,
          overflow: 'auto',
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
