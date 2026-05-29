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
          minHeight: '100dvh',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        },
        main: {
          flex: 1,
        },
        a: {
          textDecoration: 'none',
          color: palette.primary.main,
        },
      })}
    />
  );
}
