import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DESCRIPTION_EXPERIMENT_KEY } from '@/shared/api';
import { envServer } from '@/shared/config/index.server';
import { PageContainer } from '@/shared/ui';
import { resolveDescriptionExperimentKey } from './description-experiment-key';
import { DescriptionReview } from './description-review';
import { isDescriptionReviewEnabled } from './description-review-gate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Сравнение описаний',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

interface DescriptionReviewPageProps {
  searchParams?: Promise<{ qa?: string | string[]; round?: string | string[]; sessionId?: string | string[] }>;
}

export default async function DescriptionReviewPage({ searchParams }: DescriptionReviewPageProps) {
  if (!isDescriptionReviewEnabled(envServer.SITE_URL)) notFound();
  const params = await searchParams;
  let resolved;
  try {
    resolved = resolveDescriptionExperimentKey(params?.qa, DESCRIPTION_EXPERIMENT_KEY, params?.round, params?.sessionId);
  } catch {
    notFound();
  }

  return (
    <PageContainer>
      <DescriptionReview
        key={resolved.experimentKey}
        experimentKey={resolved.experimentKey}
        qaMode={resolved.qaMode}
        round={resolved.round}
      />
    </PageContainer>
  );
}
