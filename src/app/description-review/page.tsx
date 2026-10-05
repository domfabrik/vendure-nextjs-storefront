import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { envServer } from '@/shared/config/index.server';
import { PageContainer } from '@/shared/ui';
import { DescriptionReview } from './description-review';
import { isDescriptionReviewEnabled } from './description-review-gate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Сравнение описаний',
  robots: { index: false, follow: false },
};

export default function DescriptionReviewPage() {
  if (!isDescriptionReviewEnabled(envServer.SITE_URL)) notFound();

  return (
    <PageContainer>
      <DescriptionReview />
    </PageContainer>
  );
}
