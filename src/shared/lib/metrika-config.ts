export const METRIKA_IDS = {
  production: 110706774,
  test: 112305722,
} as const;

type MetrikaEnvironment = keyof typeof METRIKA_IDS;

export function resolveMetrikaConfig(hostname: string | undefined, configuredId: string | undefined): { environment: MetrikaEnvironment; id: number } | null {
  const normalizedHost = hostname?.trim().toLowerCase().replace(/\.$/, '');
  const environment = normalizedHost === 'domfabrik.ru' ? 'production' : normalizedHost === 'test.domfabrik.ru' ? 'test' : null;
  if (!environment || !configuredId || !/^\d+$/.test(configuredId)) return null;

  const id = Number(configuredId);
  return id === METRIKA_IDS[environment] ? { environment, id } : null;
}
