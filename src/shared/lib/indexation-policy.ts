export const PRODUCTION_ORIGIN = 'https://domfabrik.ru';

export function isIndexationAllowed(flag: string | undefined, storefrontOrigin: string | undefined): boolean {
  return flag === 'true' && storefrontOrigin === PRODUCTION_ORIGIN;
}
