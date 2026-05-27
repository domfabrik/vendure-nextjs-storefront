import { Container } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { PropsWithChildren } from 'react';
import { envServer, SITE_NAME } from '@/shared/config';
import { GlobalStyles, Header, Theme } from '@/shared/ui';

const openSans = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const title = `${SITE_NAME} — Элитная мебель для дома | Кухни, спальни, гостиные`;
  const description =
    'Широкий выбор дизайнерской мебели премиум-качества в магазине DomFabrik. Кухонные гарнитуры, роскошные спальные комплекты, мягкая мебель и шкафы-купе с доставкой.';

  const ogImageUrl = `${envServer.SITE_URL}/images/logo.svg`;

  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description: description,
    metadataBase: new URL(envServer.SITE_URL),

    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      title: title,
      description: description,
      url: envServer.SITE_URL,
      siteName: SITE_NAME,
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Премиальная мебель ${SITE_NAME}`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImageUrl],
    },

    alternates: {
      canonical: envServer.SITE_URL,
    },

    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-32x32.png',
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="ru">
      <body className={openSans.variable}>
        <AppRouterCacheProvider>
          <Theme>
            <GlobalStyles />
            <Header />
            <Container
              maxWidth="xl"
              sx={{ mb: 4 }}
            >
              {props.children}
            </Container>
          </Theme>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
