'use server';

import { Box, Typography } from '@mui/material';
import { contacts, routes } from '@routes';
import NextLink from 'next/link';
import { getAllCollections } from '@/shared/api';
import { CartBadge } from './components/cart-badge';
import { CatalogDrawer } from './components/catalog-drawer';
import { CategoryNav } from './components/category-nav';
import { Search } from './components/search';
import { TopBar } from './components/top-bar';

export async function Header() {
  const collections = await getAllCollections();

  return (
    <>
      <TopBar />
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E6E2DB', position: 'sticky', top: 0, zIndex: 1100 }}>
        <Box
          sx={{
            maxWidth: 1280,
            mx: 'auto',
            px: { xs: 1, sm: 4 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 3 },
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          }}
        >
          {/* Логотип */}
          <NextLink
            href={routes.home()}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}
          >
            <svg
              width="34"
              height="34"
              viewBox="18 10 62 76"
              aria-hidden="true"
            >
              <path
                d="M22 32 L48 14 L74 32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M26 40 H50 a22 21 0 0 1 0 42 H26 Z M36 50 V72 H50 a11 11 0 0 0 0 -22 Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
            <Typography sx={{ fontSize: 24, letterSpacing: '-0.5px', color: 'text.primary' }}>
              <span style={{ fontWeight: 800 }}>Дом</span>
              <span style={{ fontWeight: 500, color: '#6B7586' }}>Фабрик</span>
            </Typography>
          </NextLink>

          {/* Поиск — на мобильных уходит на вторую строку */}
          <Box sx={{ order: { xs: 3, md: 0 }, flex: { xs: '1 1 100%', md: 1 } }}>
            <Search />
          </Box>

          {/* Кнопка Каталог — прибита к правому краю на мобильных */}
          <Box sx={{ ml: { xs: 'auto', md: 0 } }}>
            <CatalogDrawer collections={collections} />
          </Box>

          {/* Телефон */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', flexShrink: 0, lineHeight: 1.3 }}>
            <a
              href={contacts.phoneHref}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {contacts.phone}
              </Typography>
            </a>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              {contacts.workingHours}
            </Typography>
          </Box>

          {/* Корзина */}
          <CartBadge />
        </Box>

        {/* Навигация по категориям */}
        <CategoryNav collections={collections} />
      </header>
    </>
  );
}
