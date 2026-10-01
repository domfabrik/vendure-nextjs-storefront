export { contacts } from './contacts';

export const routes = {
  home: () => '/',
  catalog: () => '/catalog',
  cart: () => '/cart',
  collection: (slug: string) => `/collections/${slug}`,
  product: (slug: string, variantId?: string) => (variantId ? `/products/${slug}?variant=${encodeURIComponent(variantId)}` : `/products/${slug}`),
  search: (params: string | Record<string, string>) => {
    if (typeof params === 'string') {
      return `/search?${new URLSearchParams({ q: params }).toString()}`;
    }
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
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
