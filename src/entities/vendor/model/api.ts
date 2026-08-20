'use server';

import { getFacets } from '@/shared/api';
import type { Vendor } from './vendor';
import { defaultVendorConfig, vendorsConfig } from './vendors-config';

const BRAND_FACET_CODE = 'brand';

export async function getVendors(): Promise<Vendor[]> {
  const facets = await getFacets();
  const brandFacet = facets.items.find((f) => f.code === BRAND_FACET_CODE);

  if (!brandFacet) {
    return [];
  }

  return brandFacet.values.map((value) => {
    const config = vendorsConfig[value.id] ?? defaultVendorConfig;
    return {
      id: value.id,
      name: value.name,
      code: value.code,
      description: config.description,
      logo: config.logo,
      banner: config.banner,
      invertLogo: config.invertLogo ?? false,
    };
  });
}
