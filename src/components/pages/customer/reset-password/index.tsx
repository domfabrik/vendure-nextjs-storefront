import { zodResolver } from '@hookform/resolvers/zod';
import { InferGetServerSidePropsType } from 'next';

import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ContentContainer } from '@/src/components/atoms/ContentContainer';
import { TP } from '@/src/components/atoms/TypoGraphy';
import { Banner, Input } from '@/src/components/forms';
import { Button } from '@/src/components/molecules/Button';
import { storefrontApiMutation } from '@/src/graphql/client';
import { Layout } from '@/src/layouts';
import { usePush } from '@/src/lib/redirect';
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

type FormValues = { password: string; confirmPassword: string };

export const ResetPasswordPage = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const ctx = useChannels();
  const schema = z
    .object({
      password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(25, 'Пароль не может быть длиннее 25 символов'),
      confirmPassword: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(25, 'Пароль не может быть длиннее 25 символов'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Пароли должны совпадать',
      path: ['confirmPassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const push = usePush();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const { resetPassword } = await storefrontApiMutation(ctx)({
        resetPassword: [
          { password: data.password, token: props.token as string },
          {
            __typename: true,
            '...on CurrentUser': { id: true },
            '...on NativeAuthStrategyError': {
              errorCode: true,
              message: true,
            },
            '...on NotVerifiedError': {
              errorCode: true,
              message: true,
            },
            '...on PasswordResetTokenExpiredError': {
              errorCode: true,
              message: true,
            },
            '...on PasswordResetTokenInvalidError': {
              errorCode: true,
              message: true,
            },
            '...on PasswordValidationError': {
              errorCode: true,
              message: true,
              validationErrorMessage: true,
            },
          },
        ],
      });

      if (resetPassword.__typename === 'CurrentUser') {
        push('/customer/sign-in');
        return;
      }

      setError('root', { message: BACKEND_ERRORS[resetPassword.errorCode] || 'Неизвестная ошибка' });
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
          <Absolute w100>
            <Banner
              error={errors.root}
              clearErrors={() => setError('root', { message: undefined })}
            />
          </Absolute>
          <TP weight={600}>{'Сброс пароля'}</TP>
          <FormWrapper
            column
            itemsCenter
            gap="1.75rem"
          >
            <FormContent
              w100
              column
              itemsCenter
              gap="1.75rem"
            >
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  error={errors.password}
                  label={'Новый пароль'}
                  type="password"
                  {...register('password')}
                />
                <Input
                  error={errors.confirmPassword}
                  label={'Подтвердите новый пароль'}
                  type="password"
                  {...register('confirmPassword')}
                />
                <Button
                  loading={isSubmitting}
                  type="submit"
                >
                  {'Сбросить пароль'}
                </Button>
              </Form>
            </FormContent>
          </FormWrapper>
        </FormContainer>
      </ContentContainer>
    </Layout>
  );
};
