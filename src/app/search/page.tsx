import type { Metadata } from 'next';
import { SITE_NAME } from '@/shared/config';
import { SearchPage } from './search-page';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { q } = await props.searchParams;
  const title = q ? `Поиск: «${q}» | ${SITE_NAME}` : `Поиск товаров | ${SITE_NAME}`;

  return {
    title,
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <SearchPage />;
}
