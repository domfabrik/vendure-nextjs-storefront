import * as z from 'zod';

const envModel = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  VENDURE_SERVER_URL: z.string({ message: 'empty VENDURE_SERVER_URL' }),
  SITE_URL: z.string().default('https://domfabrik.ru'),
});

export const envServer = envModel.parse({
  NODE_ENV: process.env.NODE_ENV,

  VENDURE_SERVER_URL: process.env.VENDURE_SERVER_URL,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
