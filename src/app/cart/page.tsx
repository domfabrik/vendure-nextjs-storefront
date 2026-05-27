import type { Metadata } from 'next';
import { SITE_NAME } from '@/shared/config';
import { CartPage } from './cart-page';

export const metadata: Metadata = {
  title: `Корзина | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartPage />;
}
