import styled from '@emotion/styled';
import { CreditCard, MoveLeft, ShoppingCart, Truck } from 'lucide-react';
import { InferGetServerSidePropsType } from 'next';

import { ContentContainer, Divider, Link, Price, Stack, TP } from '@/src/components/atoms';
import { Discounts } from '@/src/components/molecules/Discounts';
import { Layout } from '@/src/layouts';
import { CustomerWrap } from '../../../components/shared';
import { CustomerNavigation } from '../../components/CustomerNavigation';
import { CustomerOrderStatus } from '../components/CustomerOrderStates';
import { OrderAddress } from '../components/OrderAddress';
import { OrderCustomer } from '../components/OrderCustomer';
import { OrderLine } from '../components/OrderLine';
import { OrderPaymentState } from '../components/OrderPaymentState';
import { OrderShippingStatus } from '../components/OrderShippingStatus';
import { getServerSideProps } from './props';

export const OrderPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const order = props.activeCustomer?.orders.items?.[0];
  const currencyCode = order?.currencyCode;

  const paymentMethod = order?.payments?.[0];
  const shippingMethod = order?.shippingLines?.[0];

  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={`${'Заказ'} #${order?.code}`}
    >
      <ContentContainer>
        <Stack
          w100
          justifyEnd
        >
          <CustomerNavigation />
        </Stack>
        <CustomerWrap
          itemsStart
          gap="1.75rem"
        >
          <Stack
            column
            w100
            gap="3.5rem"
          >
            <Stack
              column
              gap="2.5rem"
            >
              <StyledLink href="/customer/manage/orders">
                <MoveLeft size={20} />
                {'К моим заказам'}
              </StyledLink>
              <Stack
                itemsStart
                justifyBetween
              >
                <Stack
                  column
                  gap="0.25rem"
                >
                  <TP
                    size="2rem"
                    weight={500}
                  >
                    {'Код заказа'}
                  </TP>
                  <TP>#{order?.code}</TP>
                </Stack>
                <OrderPaymentState payment={paymentMethod} />
              </Stack>
              <CustomerOrderStatus state={order?.state} />
            </Stack>
            <Stack
              w100
              justifyBetween
              gap="2.5rem"
            >
              <Stack
                w100
                column
                gap="2.5rem"
              >
                <OrderCustomer customer={order?.customer} />
                <OrderShippingStatus
                  currencyCode={currencyCode}
                  shipping={shippingMethod}
                  label={'Способ доставки'}
                />
                <Stack
                  w100
                  gap="3.5rem"
                >
                  <OrderAddress
                    address={order?.shippingAddress}
                    label={'Адрес доставки'}
                    icon={<Truck size={'1.6rem'} />}
                  />
                  <OrderAddress
                    address={order?.billingAddress}
                    label={'Адрес для счёта'}
                    icon={<CreditCard size={'1.6rem'} />}
                  />
                </Stack>
              </Stack>
              <Stack column>
                <Stack
                  w100
                  column
                  gap="2.5rem"
                >
                  <Stack
                    gap="0.5rem"
                    itemsCenter
                  >
                    <ShoppingCart size={'1.6rem'} />
                    <TP
                      size="1.25rem"
                      weight={500}
                    >
                      {'Товары'}
                    </TP>
                  </Stack>
                  {order?.lines?.map((line) => (
                    <OrderLine
                      key={line.id}
                      currencyCode={currencyCode}
                      line={line}
                    />
                  ))}
                </Stack>
                <StyledDivider />
                {order?.discounts.length > 0 ? (
                  <Discounts
                    withLabel
                    discounts={order.discounts}
                    currencyCode={currencyCode}
                  />
                ) : null}
                <Stack column>
                  <TP
                    size="1.5rem"
                    weight={500}
                  >
                    {'Общая сумма'}
                  </TP>
                  <Price
                    currencyCode={currencyCode}
                    price={order?.totalWithTax}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </CustomerWrap>
      </ContentContainer>
    </Layout>
  );
};

const StyledDivider = styled(Divider)`
    width: 100%;
    margin: 1.75rem 0;
`;

const StyledLink = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${(p) => p.theme.text.main};
`;
