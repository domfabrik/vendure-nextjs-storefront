import * as z from 'zod';

const envModel = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  API_URL: z.string({ message: 'empty API_URL' }),
  SITE_URL: z.string().default('https://domfabrik.ru'),
  STOREFRONT_ORIGIN: z.string().optional(),
  INDEXATION_ALLOW: z.string().optional(),
});

export const envServer = envModel.parse({
  NODE_ENV: process.env.NODE_ENV,

  API_URL: process.env.API_URL,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  STOREFRONT_ORIGIN: process.env.STOREFRONT_ORIGIN,
  INDEXATION_ALLOW: process.env.INDEXATION_ALLOW,
});
