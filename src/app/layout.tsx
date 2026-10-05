import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PropsWithChildren, Suspense } from 'react';
import { GoogleAnalytics } from '@/features/google-analytics';
import { MetrikaHit, MetrikaScript } from '@/features/metrika';
import { envServer, SITE_NAME } from '@/shared/config/index.server';
import { Footer, GlobalStyles, Header, ScrollToTop, Theme } from '@/shared/ui';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

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
      <body className={manrope.variable}>
        <NuqsAdapter>
          <AppRouterCacheProvider>
            <Theme>
              <GlobalStyles />

              <Suspense fallback={null}>
                <ScrollToTop />
                <MetrikaHit />
                <GoogleAnalytics />
              </Suspense>

              <Header />
              <main style={{ flex: 1 }}>{props.children}</main>
              <Footer />
            </Theme>
          </AppRouterCacheProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
