export const TEST_STOREFRONT_ORIGIN = 'https://test.domfabrik.ru';

export function isDescriptionReviewEnabled(siteUrl: string | undefined): boolean {
  return siteUrl?.trim() === TEST_STOREFRONT_ORIGIN;
}
