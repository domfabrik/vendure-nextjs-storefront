'use server';

import PhoneIcon from '@mui/icons-material/Phone';
import { AppBar, Box, Container, Typography } from '@mui/material';
import { contacts, routes } from '@routes';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { getAllCollections } from '@/shared/api';
import { CartBadge } from './components/cart-badge';
import { CatalogDrawer } from './components/catalog-drawer';
import { Search } from './components/search';
import { TopBar } from './components/top-bar';

export async function Header() {
  const collections = await getAllCollections();

  return (
    <>
      <TopBar />
      <AppBar
        position="sticky"
        color="transparent"
        sx={{
          bgcolor: 'background.paper',
          mb: 2,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 2,
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NextLink href={routes.home()}>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <NextImage
                  src="/images/logo.svg"
                  alt="logo"
                  loading="eager"
                  height={36}
                  width={173}
                />
              </Box>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <NextImage
                  src="/images/short-logo.svg"
                  alt="logo"
                  loading="eager"
                  height={36}
                  width={36}
                />
              </Box>
            </NextLink>

            <CatalogDrawer collections={collections} />
          </Box>

          <Search />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <a
              href={contacts.phoneHref}
              aria-label="Позвонить"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              <PhoneIcon sx={{ fontSize: 18 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}
              >
                {contacts.phone}
              </Typography>
            </a>
            <CartBadge />
          </Box>
        </Container>
      </AppBar>
    </>
  );
}
