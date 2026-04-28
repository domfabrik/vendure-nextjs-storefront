import { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'next-i18next';

import { Stack } from '@/src/components/atoms';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Layout } from '@/src/layouts';
import { CustomerWrap } from '../components/shared';
import { CustomerForm } from './components/CustomerForm';
import { CustomerNavigation } from './components/CustomerNavigation';
import { getServerSideProps } from './props';

export const ManageAccountPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('customer');
  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={t('accountPage.title')}
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
