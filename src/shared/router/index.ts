export { contacts } from './contacts';

export const routes = {
  home: () => '/',
  cart: () => '/cart',
  collection: (slug: string) => `/collections/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  search: (params: string | Record<string, string>) => {
    const query = typeof params === 'string' ? new URLSearchParams({ q: params }) : new URLSearchParams(params);
    return `/search?${query.toString()}`;
  },
  policy: () => '/juristic/policy',
  terms: () => '/juristic/terms',
  delivery: () => '/delivery',
  userAgreement: () => '/juristic/user-agreement',
  returns: () => '/juristic/returns',
  contacts: () => '/contacts',
  about: () => '/about',
  howToBuy: () => '/how-to-buy',
};
