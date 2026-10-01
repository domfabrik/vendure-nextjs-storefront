'use server';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';

const links = [
  { label: 'О компании', href: routes.about() },
  { label: 'Как купить', href: routes.howToBuy() },
  { label: 'Доставка', href: routes.delivery() },
  { label: 'Контакты', href: routes.contacts() },
];

export async function TopBar() {
  return (
    <Box sx={{ bgcolor: '#1B2B45', display: { xs: 'none', md: 'block' } }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 1, sm: 4 },
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: '#E8ECF2' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h11v9H3z" />
            <path d="M14 10h4l3 3v3h-7" />
            <circle
              cx="7"
              cy="17.5"
              r="1.8"
            />
            <circle
              cx="17"
              cy="17.5"
              r="1.8"
            />
          </svg>
          <Typography sx={{ fontSize: 13, color: '#E8ECF2' }}>Доставка по России</Typography>
        </Box>
        <nav style={{ display: 'flex', gap: 24 }}>
          {links.map((link) => (
            <NextLink
              key={link.href}
              href={link.href}
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={{ fontSize: 13, color: '#E8ECF2', '&:hover': { opacity: 0.8 } }}>{link.label}</Typography>
            </NextLink>
          ))}
        </nav>
      </Box>
    </Box>
  );
}
