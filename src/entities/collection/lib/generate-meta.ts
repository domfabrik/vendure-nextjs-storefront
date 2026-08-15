import type { Metadata } from 'next';
import type { Collection } from '@/shared/api';
import { envServer, SITE_NAME } from '@/shared/config/index.server';
import { stripHtml } from '@/shared/lib';

export function generateCollectionMetadata(collection: Collection, slug: string): Metadata {
  const title = `${collection.name} — купить в ${SITE_NAME} с доставкой`;
  const canonical = `${envServer.SITE_URL}/collections/${slug}`;

  const description = collection.description
    ? stripHtml(collection.description).slice(0, 160)
    : `${collection.name} — широкий выбор мебели в каталоге ${SITE_NAME}. Доставка по Туле и России.`;

  const ogImage = collection.featuredAsset ? `${collection.featuredAsset.preview}?w=1200&h=630&format=webp` : `${envServer.SITE_URL}/images/logo.webp`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'ru_RU',
      images: [{ url: ogImage, width: 1200, height: 630, alt: collection.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
