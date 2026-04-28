import { InferGetServerSidePropsType } from 'next';

import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { Banner } from '@/src/components/forms';
import { Layout } from '@/src/layouts';

import { Absolute, FormContainer, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';

const BACKEND_ERRORS: Record<string, string> = {
  UNKNOWN_ERROR: 'Неизвестная ошибка',
  VERIFICATION_TOKEN_INVALID_ERROR: 'Недействительный токен верификации',
  VERIFICATION_TOKEN_EXPIRED_ERROR: 'Срок действия токена верификации истёк',
  MISSING_PASSWORD_ERROR: 'Пароль не указан',
  PASSWORD_VALIDATION_ERROR: 'Ошибка валидации пароля',
  PASSWORD_ALREADY_SET_ERROR: 'Пароль уже установлен',
  NATIVE_AUTH_STRATEGY_ERROR: 'Ошибка стратегии авторизации',
};

export const VerifyPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={'Подтверждение аккаунта'}
    >
      <ContentContainer>
        <FormContainer>
          <FormWrapper
            column
            itemsCenter
            gap="3.5rem"
          >
            {props.status.verifyCustomerAccount.__typename !== 'CurrentUser' ? (
              <>
                <Absolute w100>
                  <Banner
                    initial={{ opacity: 1 }}
                    error={{
                      message: BACKEND_ERRORS[props.status.verifyCustomerAccount.errorCode] || 'Неизвестная ошибка',
                    }}
                  />
                </Absolute>
                <Stack
                  justifyCenter
                  itemsCenter
                  column
                  gap="2rem"
                >
                  <TP>{'Не удалось подтвердить аккаунт'}</TP>
                  <Link href="/">{'Главная'}</Link>
                </Stack>
              </>
            ) : (
              <Stack
                justifyCenter
                itemsCenter
                column
                gap="2rem"
              >
                <TP>{'Ваш аккаунт подтверждён'}</TP>
                <Link href="/customer/sign-in">{'Войти'}</Link>
              </Stack>
            )}
          </FormWrapper>
        </FormContainer>
      </ContentContainer>
    </Layout>
  );
};
