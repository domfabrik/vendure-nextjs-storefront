import checkout from '../../public/locales/en/checkout.json';
import collections from '../../public/locales/en/collections.json';
import common from '../../public/locales/en/common.json';
import customer from '../../public/locales/en/customer.json';
import homepage from '../../public/locales/en/homepage.json';
import products from '../../public/locales/en/products.json';

const resources = {
  common,
  homepage,
  checkout,
  customer,
  products,
  collections,
} as const;

export default resources;
