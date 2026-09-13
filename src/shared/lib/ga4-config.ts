export const GA4_IDS = {
  production: 'G-P8696MK1EF',
  test: 'G-0M5G35PLZW',
} as const;

export type Ga4Environment = keyof typeof GA4_IDS;

export interface Ga4Config {
  environment: Ga4Environment;
  id: string;
  origin: string;
  debug: boolean;
}

export function resolveGa4Config(hostname: string | undefined, configuredId: string | undefined, enabled: string | undefined, debug: string | undefined): Ga4Config | null {
  const normalizedHost = hostname?.trim().toLowerCase().replace(/\.$/, '');
  const environment = normalizedHost === 'domfabrik.ru' ? 'production' : normalizedHost === 'test.domfabrik.ru' ? 'test' : null;
  if (!environment || enabled !== 'true' || configuredId !== GA4_IDS[environment]) return null;

  return {
    environment,
    id: configuredId,
    origin: environment === 'production' ? 'https://domfabrik.ru' : 'https://test.domfabrik.ru',
    debug: environment === 'test' && debug === 'true',
  };
}
