'use server';

import { Box, Container, Typography } from '@mui/material';
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
    <Box
      sx={{
        bgcolor: 'primary.main',
        py: 0.5,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 3,
        }}
      >
        {links.map((link) => (
          <NextLink
            key={link.href}
            href={link.href}
            style={{ textDecoration: 'none' }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'common.white', '&:hover': { opacity: 0.8 } }}
            >
              {link.label}
            </Typography>
          </NextLink>
        ))}
      </Container>
    </Box>
  );
}
