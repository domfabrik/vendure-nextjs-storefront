export const routes = {
  home: () => '/',
  cart: () => '/cart',
  collection: (slug: string) => `/collections/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  search: (query: string) => `/search?q=${query}`,
};
