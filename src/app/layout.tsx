import { Container } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { GeistSans } from 'geist/font/sans';
import { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PropsWithChildren, Suspense } from 'react';
import { MetrikaHit, MetrikaScript } from '@/features/metrika';
import { envServer, SITE_NAME } from '@/shared/config';
import { Footer, GlobalStyles, Header, ScrollToTop, Theme } from '@/shared/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const title = `${SITE_NAME} — Элитная мебель для дома | Кухни, спальни, гостиные`;
  const description =
    'Широкий выбор дизайнерской мебели премиум-качества в магазине Дом Фабрик. Кухонные гарнитуры, роскошные спальные комплекты, мягкая мебель и шкафы-купе с доставкой.';
  return {
    title,
    description,
    metadataBase: new URL(envServer.SITE_URL),

    openGraph: {
      title,
      description,
      url: envServer.SITE_URL,
      siteName: SITE_NAME,
      locale: 'ru_RU',
      type: 'website',
      images: [{ url: '/images/logo.webp', width: 1200, height: 630, alt: `Премиальная мебель ${SITE_NAME}` }],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/logo.webp'],
    },

    alternates: {
      canonical: envServer.SITE_URL,
    },

    icons: {
      icon: '/icons/favicon',
      apple: '/icons/apple-touch',
    },

    manifest: '/manifest.webmanifest',
  };
}

export default async function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preconnect"
          href={new URL(envServer.SITE_URL).origin}
        />
        <MetrikaScript />
      </head>
      <body className={GeistSans.variable}>
        <NuqsAdapter>
          <AppRouterCacheProvider>
            <Theme>
              <GlobalStyles />

              <Suspense fallback={null}>
                <ScrollToTop />
                <MetrikaHit />
              </Suspense>

              <Header />
              <Container
                component="main"
                maxWidth="xl"
                sx={{ mb: 4 }}
              >
                {props.children}
              </Container>
              <Footer />
            </Theme>
          </AppRouterCacheProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
