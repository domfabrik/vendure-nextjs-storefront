import { contacts } from '@routes';
import type { HomepageCollection } from '@/shared/api';
import { SITE_NAME } from '@/shared/config';

export function buildOrganizationJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.webp`,
    image: `${siteUrl}/images/logo.webp`,
    telephone: contacts.phoneHref.replace('tel:', ''),
    email: contacts.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contacts.address,
      addressLocality: 'Тула',
      addressCountry: 'RU',
    },
    priceRange: '₽₽',
  };
}

export function buildWebSiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildHomepageItemListJsonLd(collections: HomepageCollection[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: collections.map((collection, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: collection.name,
      url: `${siteUrl}/collections/${collection.slug}`,
    })),
  };
}
