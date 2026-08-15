import { buildHomepageItemListJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/entities/site';
import { envServer } from '@/shared/config/index.server';
import type { HomepageCollection } from '@/shared/model';

interface Props {
  collections: HomepageCollection[];
}

export function LdScript(props: Props) {
  const organizationJsonLd = buildOrganizationJsonLd(envServer.SITE_URL);
  const webSiteJsonLd = buildWebSiteJsonLd(envServer.SITE_URL);
  const itemListJsonLd = buildHomepageItemListJsonLd(props.collections, envServer.SITE_URL);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
