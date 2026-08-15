import type { MetadataRoute } from 'next';
import { envServer, SITE_NAME } from '@/shared/config/index.server';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Элитная мебель для дома`,
    short_name: SITE_NAME,
    description: 'Широкий выбор дизайнерской мебели премиум-качества. Кухни, спальни, гостиные с доставкой.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1B2B45',
    icons: [
      {
        src: `${envServer.SITE_URL}/icons/pwa/192`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${envServer.SITE_URL}/icons/pwa/512`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `${envServer.SITE_URL}/icons/pwa/512`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
