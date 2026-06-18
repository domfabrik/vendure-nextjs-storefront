import type { Metadata } from 'next';
import type { Product } from '@/shared/api';
import { envServer, SITE_NAME } from '@/shared/config';

function buildDescription(product: Product): string {
  const parts: string[] = [product.name];
  const cf = product.customFields;

  // Габариты
  if (cf.dimensionsMm) {
    if (typeof cf.dimensionsMm === 'object') {
      const { width, depth, height } = cf.dimensionsMm;
      const dims = [width && `Ш ${width}`, depth && `Г ${depth}`, height && `В ${height}`].filter(Boolean).join(' \u00d7 ');
      if (dims) parts.push(`${dims} мм`);
    } else if (typeof cf.dimensionsMm === 'string' && cf.dimensionsMm.trim()) {
      parts.push(cf.dimensionsMm.trim());
    }
  }

  // Каркас
  if (cf.frameMaterialText) {
    parts.push(`каркас ${cf.frameMaterialText}`);
  }

  // Фасад
  if (cf.facadeMaterialText) {
    parts.push(`фасад ${cf.facadeMaterialText}`);
  }

  // Гарантия
  if (cf.warrantyMonths) {
    parts.push(`гарантия ${cf.warrantyMonths} мес.`);
  }

  const cta = `Купить в ${SITE_NAME} с доставкой.`;
  const joined = `${parts.join(' \u2014 ')}. ${cta}`;

  if (joined.length <= 160) return joined;

  // Если слишком длинно — обрезаем до 160 символов
  const trimmed = joined.slice(0, 157);
  return `${trimmed.slice(0, trimmed.lastIndexOf(' '))}...`;
}

export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} — купить в ${SITE_NAME}`;
  const canonical = `${envServer.SITE_URL}/products/${product.slug}`;

  const description = product.description ? buildDescription(product) : `Купить ${product.name} в интернет-магазине ${SITE_NAME}`;

  const ogImage = product.featuredAsset ? `${product.featuredAsset.preview}?w=1200&h=630&format=webp` : `${envServer.SITE_URL}/icons/og.png`;
  const allImages = product.assets.map((a) => `${a.preview}?w=1200&h=630&format=webp`);

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }, ...allImages.slice(1).map((url) => ({ url, width: 1200, height: 630 }))],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
