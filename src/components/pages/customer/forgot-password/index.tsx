import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { InferGetServerSidePropsType } from 'next';

import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { Banner, Input } from '@/src/components/forms';
import { Button } from '@/src/components/molecules/Button';
import { storefrontApiMutation } from '@/src/graphql/client';
import { Layout } from '@/src/layouts';
import { useChannels } from '@/src/state/channels';
import { Absolute, Form, FormContainer, FormContent, FormWrapper } from '../components/shared';
import { getServerSideProps } from './props';

const BACKEND_ERRORS: Record<string, string> = {
  UNKNOWN_ERROR: 'Неизвестная ошибка',
  NATIVE_AUTH_STRATEGY_ERROR: 'Ошибка стратегии авторизации',
  INVALID_CREDENTIALS_ERROR: 'Неверные учётные данные',
  ORDER_STATE_TRANSITION_ERROR: 'Ошибка смены статуса заказа',
  EMAIL_ADDRESS_CONFLICT_ERROR: 'Этот email уже используется',
  GUEST_CHECKOUT_ERROR: 'Ошибка гостевого оформления',
  ORDER_LIMIT_ERROR: 'Превышен лимит заказа',
  NEGATIVE_QUANTITY_ERROR: 'Количество не может быть отрицательным',
  INSUFFICIENT_STOCK_ERROR: 'Недостаточно товара на складе',
  COUPON_CODE_INVALID_ERROR: 'Недействительный купон',
  COUPON_CODE_EXPIRED_ERROR: 'Срок действия купона истёк',
  COUPON_CODE_LIMIT_ERROR: 'Лимит использования купона исчерпан',
  ORDER_MODIFICATION_ERROR: 'Ошибка изменения заказа',
  INELIGIBLE_SHIPPING_METHOD_ERROR: 'Недоступный способ доставки',
  NO_ACTIVE_ORDER_ERROR: 'Нет активного заказа',
  ORDER_PAYMENT_STATE_ERROR: 'Ошибка статуса оплаты заказа',
  INELIGIBLE_PAYMENT_METHOD_ERROR: 'Недоступный способ оплаты',
  PAYMENT_FAILED_ERROR: 'Ошибка оплаты',
  PAYMENT_DECLINED_ERROR: 'Оплата отклонена',
  ALREADY_LOGGED_IN_ERROR: 'Вы уже авторизованы',
  MISSING_PASSWORD_ERROR: 'Пароль не указан',
  PASSWORD_VALIDATION_ERROR: 'Ошибка валидации пароля',
  PASSWORD_ALREADY_SET_ERROR: 'Пароль уже установлен',
  VERIFICATION_TOKEN_INVALID_ERROR: 'Недействительный токен верификации',
  VERIFICATION_TOKEN_EXPIRED_ERROR: 'Срок действия токена верификации истёк',
  IDENTIFIER_CHANGE_TOKEN_INVALID_ERROR: 'Недействительный токен смены идентификатора',
  IDENTIFIER_CHANGE_TOKEN_EXPIRED_ERROR: 'Срок действия токена смены идентификатора истёк',
  PASSWORD_RESET_TOKEN_INVALID_ERROR: 'Недействительный токен сброса пароля',
  PASSWORD_RESET_TOKEN_EXPIRED_ERROR: 'Срок действия токена сброса пароля истёк',
  NOT_VERIFIED_ERROR: 'Аккаунт не подтверждён',
};

type FormValues = {
  emailAddress: string;
};

export const ForgotPasswordPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const ctx = useChannels();
  const [success, setSuccess] = useState<string>();

  const schema = z.object({
    emailAddress: z.string().email('Некорректный email').min(1, 'Email обязателен'),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<{ emailAddress: string }> = async (data) => {
    const { emailAddress } = data;
    try {
      const { requestPasswordReset } = await storefrontApiMutation(ctx)({
        requestPasswordReset: [
          { emailAddress },
          {
            __typename: true,
            '...on Success': {
              success: true,
            },
            '...on NativeAuthStrategyError': {
              errorCode: true,
              message: true,
            },
          },
        ],
      });

      if (!requestPasswordReset) {
        setError('root', { message: 'Неизвестная ошибка' });

        return;
      }

      if (requestPasswordReset?.__typename === 'Success') {
        setSuccess('Мы отправили вам письмо с инструкциями по сбросу пароля');
        return;
      }

      setError('root', { message: BACKEND_ERRORS[requestPasswordReset.errorCode] || 'Неизвестная ошибка' });
    } catch {
      setError('root', { message: 'Неизвестная ошибка' });
    }
  };

  return (
    <Layout
      categories={props.collections}
      navigation={props.navigation}
      pageTitle={'Сброс пароля'}
    >
      <ContentContainer>
        <FormContainer>
          <FormWrapper
            column
            itemsCenter
            gap="3.5rem"
          >
            <Absolute w100>
              <Banner
                error={errors.root}
                success={success ? { message: success } : undefined}
                clearErrors={() => {
                  setError('root', { message: undefined });
                  setSuccess(undefined);
                }}
              />
            </Absolute>
            <TP weight={600}>{'Сброс пароля'}</TP>
            <FormContent
              w100
              column
              itemsCenter
              gap="1.75rem"
            >
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  error={errors.emailAddress}
                  label={'Email'}
                  type="text"
                  {...register('emailAddress')}
                />
                <Button
                  loading={isSubmitting}
                  type="submit"
                >
                  {'Новый пароль'}
                </Button>
              </Form>
              <Stack
                column
                itemsCenter
                gap="0.5rem"
              >
                <StyledLink href="/customer/sign-in">{'Войти'}</StyledLink>
                <StyledLink href="/customer/sign-up">{'Регистрация'}</StyledLink>
              </Stack>
            </FormContent>
          </FormWrapper>
        </FormContainer>
      </ContentContainer>
    </Layout>
  );
};

const StyledLink = styled(Link)`
    position: relative;
    color: ${({ theme }) => theme.text.main};
    display: block;
    transition: text-decoration 0.3s ease;

    &:hover {
        text-decoration: underline;
    }
`;
