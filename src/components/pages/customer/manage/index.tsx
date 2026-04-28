import { InferGetServerSidePropsType } from 'next';

import { Stack } from '@/src/components/atoms';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Layout } from '@/src/layouts';
import { CustomerWrap } from '../components/shared';
import { CustomerForm } from './components/CustomerForm';
import { CustomerNavigation } from './components/CustomerNavigation';
import { getServerSideProps } from './props';

export const ManageAccountPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={'Мой аккаунт'}
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
          w100
          gap="3rem"
        >
          <CustomerForm initialCustomer={props.activeCustomer} />
        </CustomerWrap>
      </ContentContainer>
    </Layout>
  );
};
