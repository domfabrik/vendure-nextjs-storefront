import { Container } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { GlobalStyles, Header, Theme } from '@/shared/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const siteName = 'DomFabrik';
  const baseUrl = 'https://test.domfabrik.ru';

  const title = 'DomFabrik — Элитная мебель для дома | Кухни, спальни, гостиные';
  const description =
    'Широкий выбор дизайнерской мебели премиум-качества в магазине DomFabrik. Кухонные гарнитуры, роскошные спальные комплекты, мягкая мебель и шкафы-купе с доставкой.';

  const ogImageUrl = `${baseUrl}/images/logo.svg`;

  return {
    title: title,
    description: description,
    metadataBase: new URL(baseUrl),

    // Стандартные роботы и индексация
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

    // Open Graph — отвечает за отображение в Telegram, WhatsApp, FB, VK
    openGraph: {
      title: title,
      description: description,
      url: baseUrl,
      siteName: siteName,
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Премиальная мебель DomFabrik',
        },
      ],
    },

    // Twitter-карточки (используются многими современными мессенджерами)
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImageUrl],
    },

    // Канонические ссылки для исключения дублей в SEO
    alternates: {
      canonical: baseUrl,
    },

    // Иконки сайта
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
      <body>
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
