import type { VendorConfig } from './vendor';

/**
 * Конфигурация фабрик: описания и изображения.
 * Ключ — ID facetValue из Vendure (фасет «Бренд»).
 */
export const vendorsConfig: Record<string, VendorConfig> = {
  // Арида
  '55': {
    description: 'Крупнейший производитель корпусной мебели на юге России — спальни, гостиные, кухни с итальянским дизайном',
    logo: '/images/vendors/arida-logo.svg',
    banner: '/images/vendors/arida-banner.webp',
  },
  // Эра
  '162': {
    description: 'Ставропольская фабрика классической мебели — изысканные спальни, гостиные и столовые по лекалам итальянских мастеров',
    logo: '/images/vendors/era-logo.png',
    banner: '/images/vendors/era-banner.jpg',
    invertLogo: true,
  },
  // Fortuna Home
  '219': {
    description: 'Современные спальни, гостиные, кухни и мягкая мебель — более 500 партнёров по всей России',
    logo: '/images/vendors/fortuna-logo.svg',
    banner: '/images/vendors/fortuna-banner.jpg',
  },
  // Nartmi company
  '256': {
    description: 'Современные диваны-кровати с механизмом трансформации — комфорт и стиль в каждой детали',
    logo: '/images/vendors/nartmi-logo.png',
    banner: '/images/vendors/nartmi-banner.jpg',
    invertLogo: true,
  },
  // ФСМ
  '257': {
    description: 'Фабрика стильной мебели — диваны, кресла, стулья и столы с безупречным дизайном',
    logo: '/images/vendors/fsm-logo.png',
    banner: '/images/vendors/fsm-banner.jpg',
  },
};

export const defaultVendorConfig: VendorConfig = {
  description: '',
  logo: '/images/vendors/fsm-logo.png',
  banner: '/images/vendors/arida-banner.webp',
};
