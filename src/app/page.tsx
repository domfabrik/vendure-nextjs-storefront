import type { Metadata } from 'next';
import { Consultation, Factories, Hero, HowWeWork, NewArrivals, ProductTypes, Rooms } from '@/entities/home';
import { LdScript } from '@/entities/site/index.server';
import { vendorsConfig } from '@/entities/vendor';
import { getAllCollections, getNewProducts, getProductsByCollection } from '@/shared/api';
import { COLLECTION_IMAGES } from '@/shared/config';
import { envServer } from '@/shared/config/index.server';

export const metadata: Metadata = {
  alternates: { canonical: envServer.SITE_URL },
};

export default async function Page() {
  const [collections, newProducts] = await Promise.all([getAllCollections(), getNewProducts(1)]);

  const roomSlugs = new Set(['spalni', 'gostinyie', 'kuhnya', 'prihozhaya', 'mebel-dlya-detskoj']);
  const topLevelCollections = collections.filter((c) => c.parent?.slug === '__root_collection__');
  const roomCollections = topLevelCollections.filter((c) => roomSlugs.has(c.slug)).map((c) => ({ ...c, image: COLLECTION_IMAGES[c.slug] ?? null }));
  const subCollections = collections.filter((c) => c.parent && c.parent.slug !== '__root_collection__');

  const enrichedSubCollections = await Promise.all(
    subCollections.slice(0, 6).map(async (c) => {
      if (c.featuredAsset) return c;
      const products = await getProductsByCollection(c.slug, 1);
      const preview = products[0]?.productAsset?.preview ?? null;
      return { ...c, featuredAsset: preview ? { preview } : null };
    }),
  );

  return (
    <>
      <LdScript collections={[]} />
      <Hero />
      <Rooms collections={roomCollections} />
      <NewArrivals products={newProducts} />
      <ProductTypes collections={enrichedSubCollections} />
      <Factories
        vendors={Object.entries(vendorsConfig).map(([facetValueId, v]) => ({
          facetValueId,
          name: v.description.split('—')[0].trim(),
          logo: v.logo,
          invertLogo: v.invertLogo,
        }))}
      />
      <HowWeWork />
      <Consultation />
    </>
  );
}
