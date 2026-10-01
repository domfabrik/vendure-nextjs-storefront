import type { Metadata } from 'next';
import { SITE_NAME } from '@/shared/config';
import { PageContainer } from '@/shared/ui';
import { CartPage } from './cart-page';

export const metadata: Metadata = {
  title: `Корзина | ${SITE_NAME}`,
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PageContainer>
      <CartPage />
    </PageContainer>
  );
}
