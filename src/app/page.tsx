import type { Metadata } from 'next';
import { Consultation, Factories, Hero, HowWeWork, NewArrivals, ProductTypes, Rooms } from '@/entities/home';
import { LdScript } from '@/entities/site/index.server';
import { vendorsConfig } from '@/entities/vendor';
import { getCachedAllCollections, getCachedCollectionsWithProducts, getCachedProductsByCollection, getNewProducts } from '@/shared/api';
import { COLLECTION_IMAGES } from '@/shared/config';
import { envServer } from '@/shared/config/index.server';

export const metadata: Metadata = {
  alternates: { canonical: envServer.SITE_URL },
};

export default async function Page() {
  const start = performance.now();
  const [collections, collectionsWithProducts] = await Promise.all([getCachedAllCollections(), getCachedCollectionsWithProducts(6)]);
  const newProducts = await getNewProducts(2, collectionsWithProducts);

  const roomSlugs = new Set(['spalni', 'gostinyie', 'kuhnya', 'prihozhaya', 'mebel-dlya-detskoj']);
  const topLevelCollections = collections.filter((c) => c.parent?.slug === '__root_collection__');
  const roomCollections = topLevelCollections.filter((c) => roomSlugs.has(c.slug)).map((c) => ({ ...c, image: COLLECTION_IMAGES[c.slug] ?? null }));
  const subCollections = collections.filter((c) => c.parent && c.parent.slug !== '__root_collection__');

  const enrichedSubCollections = await Promise.all(
    subCollections.slice(0, 6).map(async (c) => {
      if (c.featuredAsset) return c;
      const products = await getCachedProductsByCollection(c.slug, 1);
      const preview = products[0]?.productAsset?.preview ?? null;
      return { ...c, featuredAsset: preview ? { preview } : null };
    }),
  );
  console.log(`[homepage] data loaded in ${(performance.now() - start).toFixed(0)}ms`);

  return (
    <>
      <LdScript collections={collectionsWithProducts.filter((c) => !c.unavailable)} />
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
