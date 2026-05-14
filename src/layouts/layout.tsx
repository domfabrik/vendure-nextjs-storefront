import styled from '@emotion/styled';
import React, { useEffect } from 'react';
import { CustomHelmet } from '@/src/components';
import { Stack } from '@/src/components/atoms/Stack';
import { CollectionTileType, NavigationType } from '@/src/graphql/selectors';
import { Footer } from '@/src/layouts/Footer';
import { Navigation } from '@/src/layouts/Navigation';
import { useCart } from '@/src/state/cart';
import { useCollection } from '@/src/state/collection';
import { useProduct } from '@/src/state/product';
import { RootNode } from '@/src/util/arrayToTree';

export const siteTitle = 'Domfabrik';

interface LayoutProps {
  pageTitle?: string;
  children: React.ReactNode;
  categories: CollectionTileType[];
  navigation: RootNode<NavigationType> | null;
}

interface CheckoutLayoutProps {
  pageTitle?: string;
  children: React.ReactNode;
}

const MainStack = styled.main`
    min-height: 100vh;
    width: 100%;
    background: ${(p) => p.theme.background.main};
`;

export const Layout = ({ pageTitle, children, categories, navigation }: LayoutProps) => {
  const { fetchActiveOrder } = useCart();
  const { product, variant } = useProduct();
  const { collection } = useCollection();

  useEffect(() => {
    fetchActiveOrder();
  }, []);

  return (
    <MainStack>
      <CustomHelmet
        pageTitle={pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle}
        product={product}
        variant={variant}
        collection={collection}
      />
      <Navigation
        navigation={navigation}
        categories={categories}
      />
      <Stack
        w100
        itemsCenter
        column
      >
        {children}
      </Stack>
      <Footer navigation={navigation} />
    </MainStack>
  );
};

export const CheckoutLayout = ({ pageTitle, children }: CheckoutLayoutProps) => {
  return (
    <MainStack>
      <CustomHelmet pageTitle={pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle} />
      <Stack
        w100
        itemsCenter
        column
      >
        {children}
      </Stack>
    </MainStack>
  );
};
