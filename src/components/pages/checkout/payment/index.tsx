import styled from '@emotion/styled';
import { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { ContentContainer, Stack } from '@/src/components/atoms';
import { CheckoutLayout } from '@/src/layouts';
import { OrderPayment } from '../components/OrderPayment';
import { OrderSummary } from '../components/OrderSummary';
import { getServerSideProps } from './props';

export const PaymentPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('checkout');
  useEffect(() => {
    window.onpopstate = () => window.history.forward();
  }, []);

  return (
    <CheckoutLayout pageTitle={`${t('seoTitles.payment')}`}>
      <Content>
        <Wrapper justifyBetween>
          <OrderPayment
            availablePaymentMethods={props.eligiblePaymentMethods}
            stripeData={props.stripeData}
          />
          <OrderSummary />
        </Wrapper>
      </Content>
    </CheckoutLayout>
  );
};

const Wrapper = styled(Stack)`
    margin-top: 1.5rem;
    flex-direction: column-reverse;
    gap: 5rem;
    @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
        gap: 10rem;
        flex-direction: row;
    }
`;

const Content = styled(ContentContainer)`
    position: relative;
    width: 1280px;
    padding: 0;

    @media (max-width: 1560px) {
        width: 1440px;
        padding: 0 4rem;
    }
`;
