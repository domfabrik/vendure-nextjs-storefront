// export const DEFAULT_CHANNEL = 'pl-channel';
// export const DEFAULT_LOCALE = 'pl';
// export const DEFAULT_NATIONAL_LOCALE = 'pl';
// export const DEFAULT_CHANNEL_SLUG = 'pl';

// export const channels = [
//     {
//         slug: DEFAULT_CHANNEL_SLUG,
//         channel: DEFAULT_CHANNEL,
//         nationalLocale: DEFAULT_NATIONAL_LOCALE,
//         locales: ['pl', 'en'],
//     },
//     { slug: 'de', channel: 'de-channel', nationalLocale: 'de', locales: ['de', 'en'] },
//     { slug: 'cz', channel: 'cz-channel', nationalLocale: 'cz', locales: ['cz', 'en'] },
// ];

export const DEFAULT_CHANNEL = 'default-channel';
export const DEFAULT_CHANNEL_SLUG = 'en';

export const DEFAULT_LOCALE = 'ru';
export const DEFAULT_NATIONAL_LOCALE = 'ru';

export const channels = [
  {
    slug: DEFAULT_CHANNEL_SLUG,
    channel: DEFAULT_CHANNEL,
    nationalLocale: DEFAULT_NATIONAL_LOCALE,
    locales: ['ru', 'en', 'pl', 'fr', 'de', 'ja', 'es'],
  },
  // {
  //     slug: 'pl',
  //     channel: 'pl-channel',
  //     nationalLocale: 'pl',
  //     locales: ['pl', 'en'],
  // },
];
