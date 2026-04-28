import { zodResolver } from '@hookform/resolvers/zod';

import { SubmitHandler, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Stack } from '@/src/components/atoms/Stack';
import { Banner, Input } from '@/src/components/forms';
import { storefrontApiMutation } from '@/src/graphql/client';
import { usePush } from '@/src/lib/redirect';
import { useChannels } from '@/src/state/channels';
import { Form, MotionCustomerWrap, StyledButton } from '../atoms/shared';

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

type ResetPasswordForm = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export const CustomerResetPasswordForm = () => {
  const ctx = useChannels();
  const push = usePush();
  const passwordSchema = z
    .object({
      oldPassword: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(25, 'Пароль не может быть длиннее 25 символов'),
      newPassword: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(25, 'Пароль не может быть длиннее 25 символов'),
      newPasswordConfirmation: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(25, 'Пароль не может быть длиннее 25 символов'),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirmation, {
      message: 'Пароли должны совпадать',
      path: ['newPasswordConfirmation'],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message: 'Пароль должен отличаться от текущего',
      path: ['newPassword'],
    });

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    values: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
    },
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordChange: SubmitHandler<ResetPasswordForm> = async (data) => {
    try {
      const { updateCustomerPassword } = await storefrontApiMutation(ctx)({
        updateCustomerPassword: [
          { currentPassword: data.oldPassword, newPassword: data.newPassword },
          {
            __typename: true,
            '...on InvalidCredentialsError': {
              message: true,
              errorCode: true,
              authenticationError: true,
            },
            '...on NativeAuthStrategyError': {
              errorCode: true,
              message: true,
            },
            '...on PasswordValidationError': {
              errorCode: true,
              message: true,
              validationErrorMessage: true,
            },
            '...on Success': {
              success: true,
            },
          },
        ],
      });

      if (updateCustomerPassword.__typename !== 'Success') {
        setError('root', { message: BACKEND_ERRORS[updateCustomerPassword.errorCode] || 'Неизвестная ошибка' });
        return;
      }

      const { logout } = await storefrontApiMutation(ctx)({ logout: { success: true } });
      if (logout.success) push('/customer/sign-in/');
    } catch (_error) {
      setError('root', { message: 'Неизвестная ошибка' });
    }
  };

  return (
    <MotionCustomerWrap
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 30,
      }}
    >
      <Form
        onSubmit={handleSubmit(onPasswordChange)}
        noValidate
      >
        <Banner
          error={{
            message: errors.newPasswordConfirmation?.message || errors.root?.message || errors.newPassword?.message,
          }}
          clearErrors={() => clearErrors(['newPasswordConfirmation', 'newPassword'])}
        />
        <Stack
          gap="2rem"
          column
          itemsCenter
        >
          <Input
            label={'Текущий пароль'}
            type="password"
            {...register('oldPassword')}
          />
          <Stack gap="1.25rem">
            <Input
              label={'Новый пароль'}
              type="password"
              {...register('newPassword')}
            />
            <Input
              label={'Подтвердите пароль'}
              type="password"
              {...register('newPasswordConfirmation')}
            />
          </Stack>
        </Stack>
        <StyledButton
          loading={isSubmitting}
          type="submit"
        >
          {'Подтвердите пароль'}
        </StyledButton>
      </Form>
    </MotionCustomerWrap>
  );
};
