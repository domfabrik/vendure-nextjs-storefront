import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, MoveLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { useRef } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { TH2, TP } from '@/src/components/atoms/TypoGraphy';
import { Banner, CheckBox, CountrySelect, FormError, Input } from '@/src/components/forms';
import { Button } from '@/src/components/molecules/Button';
import { Tooltip } from '@/src/components/molecules/Tooltip';
import { storefrontApiMutation, storefrontApiQuery } from '@/src/graphql/client';
import { ActiveCustomerType, ActiveOrderSelector, AvailableCountriesType, CreateAddressType, CreateCustomerType, ShippingMethodType } from '@/src/graphql/selectors';
import { usePush } from '@/src/lib/redirect';
import { useChannels } from '@/src/state/channels';
import { useCheckout } from '@/src/state/checkout';
import { baseCountryFromLanguage } from '@/src/util/baseCountryFromLanguage';
import { DeliveryMethod } from '../DeliveryMethod';
import { OrderSummary } from '../OrderSummary';
import { useValidationSchema } from './useValidationSchema';

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

type FormValues = CreateCustomerType & {
  deliveryMethod?: string;
  shippingDifferentThanBilling?: boolean;
  shipping: CreateAddressType;
  billing: CreateAddressType;
  // userNeedInvoice?: boolean;
  // NIP?: string;
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
  terms?: boolean;
};

interface OrderFormProps {
  availableCountries?: AvailableCountriesType[];
  activeCustomer: ActiveCustomerType | null;
  shippingMethods: ShippingMethodType[] | null;
}

const isAddressesEqual = (a: object, b?: object) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b ?? {});
  } catch (_e) {
    return false;
  }
};

export const OrderForm = ({ availableCountries, activeCustomer, shippingMethods }: OrderFormProps) => {
  const ctx = useChannels();
  const { activeOrder, changeShippingMethod } = useCheckout();
  const push = usePush();
  const schema = useValidationSchema();

  const errorRef = useRef<HTMLDivElement>(null);

  const defaultShippingAddress = activeCustomer?.addresses?.find((address) => address.defaultShippingAddress);
  const defaultBillingAddress = activeCustomer?.addresses?.find((address) => address.defaultBillingAddress);

  const countryCode =
    defaultBillingAddress?.country.code ??
    defaultShippingAddress?.country.code ??
    availableCountries?.find((country) => country.name === 'Poland')?.code ??
    baseCountryFromLanguage(ctx.locale);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    delayError: 100,
    defaultValues: {
      shippingDifferentThanBilling: defaultShippingAddress ? !isAddressesEqual(defaultShippingAddress, defaultBillingAddress) : false,
      billing: { countryCode },
      // NIP: defaultBillingAddress?.customFields?.NIP ?? '',
      // userNeedInvoice: defaultBillingAddress?.customFields?.NIP ? true : false,
    },
    values: activeCustomer
      ? {
          createAccount: false,
          emailAddress: activeCustomer.emailAddress,
          firstName: activeCustomer.firstName,
          lastName: activeCustomer.lastName,
          phoneNumber: activeCustomer.phoneNumber,
          //   NIP: defaultBillingAddress?.customFields?.NIP ?? '',
          //   userNeedInvoice: defaultBillingAddress?.customFields?.NIP ? true : false,
          shippingDifferentThanBilling: defaultShippingAddress ? !isAddressesEqual(defaultShippingAddress, defaultBillingAddress) : false,
          shipping: {
            ...defaultShippingAddress,
            streetLine1: defaultShippingAddress?.streetLine1 ?? '',
            countryCode,
          },
          billing: {
            ...defaultBillingAddress,
            streetLine1: defaultBillingAddress?.streetLine1 ?? '',
            countryCode,
          },
        }
      : undefined,
    resolver: zodResolver(schema) as any,
  });

  const onSubmit: SubmitHandler<FormValues> = async ({
    emailAddress,
    firstName,
    lastName,
    deliveryMethod,
    billing,
    shipping,
    phoneNumber,
    // NIP,
    shippingDifferentThanBilling,
    createAccount,
    password,
  }) => {
    try {
      if (deliveryMethod && activeOrder?.shippingLines[0]?.shippingMethod.id !== deliveryMethod) {
        await changeShippingMethod(deliveryMethod);
      }
      const { nextOrderStates } = await storefrontApiQuery(ctx)({ nextOrderStates: true });
      if (!nextOrderStates.includes('ArrangingPayment')) {
        setError('root', { message: 'Неизвестная ошибка' });
        return;
      }
      // Set the billing address for the order
      const { setOrderBillingAddress } = await storefrontApiMutation(ctx)({
        setOrderBillingAddress: [
          {
            input: {
              ...billing,
              defaultBillingAddress: false,
              defaultShippingAddress: false,
              // customFields: { NIP }
            },
          },
          {
            __typename: true,
            '...on Order': { id: true },
            '...on NoActiveOrderError': { message: true, errorCode: true },
          },
        ],
      });

      if (setOrderBillingAddress?.__typename !== 'Order') {
        setError('root', { message: BACKEND_ERRORS[setOrderBillingAddress.errorCode] || 'Неизвестная ошибка' });
        return;
      }

      // Set the shipping address for the order
      if (shippingDifferentThanBilling) {
        // Set the shipping address for the order if it is different than billing
        const { setOrderShippingAddress } = await storefrontApiMutation(ctx)({
          setOrderShippingAddress: [
            { input: { ...shipping, defaultBillingAddress: false, defaultShippingAddress: false } },
            {
              __typename: true,
              '...on Order': { id: true },
              '...on NoActiveOrderError': { message: true, errorCode: true },
            },
          ],
        });

        if (setOrderShippingAddress?.__typename === 'NoActiveOrderError') {
          setError('root', { message: 'Нет активного заказа' });
          return;
        }
      } else {
        // Set the billing address for the order if it is the same as shipping
        const { setOrderShippingAddress } = await storefrontApiMutation(ctx)({
          setOrderShippingAddress: [
            { input: { ...billing, defaultBillingAddress: false, defaultShippingAddress: false } },
            {
              __typename: true,
              '...on Order': { id: true },
              '...on NoActiveOrderError': { message: true, errorCode: true },
            },
          ],
        });

        if (setOrderShippingAddress?.__typename === 'NoActiveOrderError') {
          setError('root', { message: 'Нет активного заказа' });
          return;
        }
      }

      if (!activeCustomer) {
        const { setCustomerForOrder } = await storefrontApiMutation(ctx)({
          setCustomerForOrder: [
            { input: { emailAddress, firstName, lastName, phoneNumber } },
            {
              __typename: true,
              '...on Order': { id: true },
              '...on AlreadyLoggedInError': { message: true, errorCode: true },
              '...on EmailAddressConflictError': { message: true, errorCode: true },
              '...on GuestCheckoutError': { message: true, errorCode: true },
              '...on NoActiveOrderError': { message: true, errorCode: true },
            },
          ],
        });

        if (setCustomerForOrder?.__typename !== 'Order') {
          if (setCustomerForOrder.__typename === 'EmailAddressConflictError') {
            // TODO: IN THIS CASE WE SHOULD SHOW THE LOGIN FORM or ADD A LINK TO LOGIN
            setError('emailAddress', {
              message: BACKEND_ERRORS[setCustomerForOrder.errorCode] || 'Неизвестная ошибка',
            });
            setFocus('emailAddress');
          } else {
            setError('root', { message: BACKEND_ERRORS[setCustomerForOrder.errorCode] || 'Неизвестная ошибка' });
          }
          return;
        }
      }

      // Set the order state to ArrangingPayment
      const { transitionOrderToState } = await storefrontApiMutation(ctx)({
        transitionOrderToState: [
          { state: 'ArrangingPayment' },
          {
            __typename: true,
            '...on Order': ActiveOrderSelector,
            '...on OrderStateTransitionError': {
              errorCode: true,
              message: true,
              fromState: true,
              toState: true,
              transitionError: true,
            },
          },
        ],
      });

      // After all create account if needed and password is provided
      if (!activeCustomer && createAccount && password) {
        await storefrontApiMutation(ctx)({
          registerCustomerAccount: [
            { input: { emailAddress, firstName, lastName, phoneNumber, password } },
            {
              __typename: true,
              '...on MissingPasswordError': {
                message: true,
                errorCode: true,
              },
              '...on NativeAuthStrategyError': {
                message: true,
                errorCode: true,
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
      }

      if (!transitionOrderToState) {
        setError('root', { message: 'Неизвестная ошибка' });
        return;
      }

      if (transitionOrderToState?.__typename !== 'Order') {
        setError('root', { message: BACKEND_ERRORS[transitionOrderToState.errorCode] || 'Неизвестная ошибка' });
        return;
      }
      // Redirect to payment page
      push('/checkout/payment');
    } catch (_error) {
      setError('root', { message: 'Неизвестная ошибка' });
    }
  };

  return activeOrder?.totalQuantity === 0 ? (
    <Stack
      w100
      column
    >
      <Stack
        column
        gap="2rem"
      >
        <TH2
          size="2rem"
          weight={500}
        >
          {'Ваша корзина пуста'}
        </TH2>
        <EmptyCartDescription>
          В вашей корзине нет товаров. Нажмите <Link href="/">здесь</Link>, чтобы продолжить покупки.
        </EmptyCartDescription>
      </Stack>
    </Stack>
  ) : (
    <Stack
      w100
      column
    >
      <Banner
        ref={errorRef}
        clearErrors={() => clearErrors('root')}
        error={errors?.root}
      />
      <Form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Container
          w100
          gap="10rem"
        >
          <OrderSummary
            shipping={
              shippingMethods ? (
                <DeliveryMethodWrapper>
                  <DeliveryMethod
                    selected={watch('deliveryMethod')}
                    error={errors.deliveryMethod?.message}
                    onChange={async (id) => {
                      await changeShippingMethod(id);
                      setValue('deliveryMethod', id);
                      clearErrors('deliveryMethod');
                    }}
                    shippingMethods={shippingMethods}
                    currencyCode={activeOrder?.currencyCode}
                  />
                </DeliveryMethodWrapper>
              ) : null
            }
            footer={
              <Stack
                column
                gap="2.5rem"
                justifyCenter
                itemsCenter
              >
                <StyledButton
                  loading={isSubmitting}
                  type="submit"
                >
                  <TP
                    color="contrast"
                    upperCase
                  >
                    {'Перейти к оплате'}
                  </TP>
                </StyledButton>
                <LinkButton href="/">{'Продолжить покупки'}</LinkButton>
              </Stack>
            }
          />
          <Stack
            w100
            column
            gap="2rem"
          >
            <Stack
              column
              gap="0.5rem"
            >
              {/* Customer Part */}
              <Stack
                column
                gap="2rem"
              >
                <Stack
                  gap="0.75rem"
                  itemsCenter
                  style={{ height: '2.6rem' }}
                >
                  <AnimatePresence>
                    {!isSubmitting ? (
                      <BackButton href="/">
                        <MoveLeft size={24} />
                      </BackButton>
                    ) : null}
                  </AnimatePresence>
                  <TH2
                    size="2rem"
                    weight={500}
                  >
                    {'Контактная информация'}
                  </TH2>
                </Stack>

                <Stack
                  w100
                  column
                  gap="1.5rem"
                >
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('firstName')}
                      placeholder={'Имя'}
                      label={'Имя'}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      {...register('lastName')}
                      placeholder={'Фамилия'}
                      label={'Фамилия'}
                      error={errors.lastName}
                      required
                    />
                  </Stack>
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('phoneNumber', {
                        onChange: (e) => (e.target.value = e.target.value.replace(/[^0-9]/g, '')),
                      })}
                      placeholder={'Номер телефона'}
                      type="tel"
                      label={'Телефон'}
                      error={errors.phoneNumber}
                    />
                    <Input
                      {...register('emailAddress')}
                      placeholder={'Email'}
                      label={'Email'}
                      error={errors.emailAddress}
                      required
                      disabled={!!activeCustomer?.id}
                    />
                  </Stack>
                </Stack>
              </Stack>

              {/* Shipping Part */}
              <BillingWrapper column>
                <TH2
                  size="2rem"
                  weight={500}
                  style={{ marginBottom: '1.75rem' }}
                >
                  {'Адрес для счёта'}
                </TH2>
                <Stack
                  w100
                  column
                  gap="1.5rem"
                >
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('billing.fullName')}
                      placeholder={'Полное имя'}
                      label={'Полное имя'}
                      error={errors.billing?.fullName}
                      required
                    />
                    <Input
                      {...register('billing.city')}
                      placeholder={'Город'}
                      label={'Город'}
                      error={errors.billing?.city}
                      required
                    />
                  </Stack>
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('billing.streetLine1')}
                      placeholder={'Адрес'}
                      label={'Адрес'}
                      error={errors.billing?.streetLine1}
                      required
                    />
                    <Input
                      {...register('billing.streetLine2')}
                      placeholder={'Квартира, офис и т.д.'}
                      label={'Квартира, офис и т.д.'}
                      error={errors.billing?.streetLine2}
                    />
                  </Stack>
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('billing.province')}
                      placeholder={'Область / Регион'}
                      label={'Область / Регион'}
                      error={errors.billing?.province}
                      required
                    />
                    <Input
                      {...register('billing.postalCode')}
                      placeholder={'Почтовый индекс'}
                      label={'Почтовый индекс'}
                      error={errors.billing?.postalCode}
                      required
                    />
                  </Stack>
                  <Stack
                    w100
                    gap="1.5rem"
                  >
                    <Input
                      {...register('billing.company')}
                      placeholder={'Компания'}
                      label={'Компания'}
                      error={errors.billing?.company}
                    />
                    {availableCountries && (
                      <CountrySelect
                        {...register('billing.countryCode')}
                        placeholder={'Страна'}
                        label={'Страна'}
                        defaultValue={countryCode}
                        options={availableCountries}
                        error={errors.billing?.countryCode}
                        required
                      />
                    )}
                  </Stack>
                </Stack>
              </BillingWrapper>
            </Stack>

            <Stack
              justifyBetween
              itemsCenter
            >
              {/* <CheckBox
                        {...register('userNeedInvoice', {
                            onChange: e => {
                                setValue('userNeedInvoice', e.target.checked);
                                setValue('NIP', '');
                            },
                        })}
                        label={"Нужен счёт-фактура?"}
                    /> */}
              <CheckBox
                {...register('shippingDifferentThanBilling')}
                checked={watch('shippingDifferentThanBilling')}
                label={'Адрес доставки отличается от адреса для счёта?'}
              />
            </Stack>

            {/* NIP */}
            {/* <AnimatePresence>
                    {watch('userNeedInvoice') && (
                        <FVInputWrapper
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}>
                            <Input
                                {...register('NIP')}
                                label={"ИНН"}
                                error={errors.NIP}
                                placeholder="NIP"
                                required
                            />
                        </FVInputWrapper>
                    )}
                </AnimatePresence> */}

            {/* Billing Part */}
            <AnimatePresence>
              {watch('shippingDifferentThanBilling') && (
                <ShippingWrapper
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TH2
                    size="2rem"
                    weight={500}
                    style={{ marginBottom: '1.75rem' }}
                  >
                    {'Адрес доставки'}
                  </TH2>
                  <Stack column>
                    <Stack
                      w100
                      gap="1.75rem"
                    >
                      <Input
                        {...register('shipping.fullName')}
                        label={'Полное имя'}
                        error={errors.shipping?.fullName}
                        required
                      />
                      <Input
                        {...register('shipping.company')}
                        label={'Компания'}
                        error={errors.shipping?.company}
                      />
                    </Stack>
                    <Stack
                      w100
                      gap="1.75rem"
                    >
                      <Input
                        {...register('shipping.streetLine1')}
                        label={'Адрес'}
                        error={errors.shipping?.province}
                        required
                      />
                      <Input
                        {...register('shipping.streetLine2')}
                        label={'Квартира, офис и т.д.'}
                        error={errors.shipping?.postalCode}
                        required
                      />
                    </Stack>
                    <Stack
                      w100
                      gap="1.75rem"
                    >
                      <Input
                        {...register('shipping.city')}
                        label={'Город'}
                        error={errors.shipping?.city}
                        required
                      />
                      {availableCountries && (
                        <CountrySelect
                          {...register('shipping.countryCode')}
                          label={'Страна'}
                          defaultValue={countryCode}
                          options={availableCountries}
                          error={errors.shipping?.countryCode}
                          required
                        />
                      )}
                    </Stack>
                    <Stack gap="1.75rem">
                      <Input
                        {...register('shipping.province')}
                        label={'Область / Регион'}
                        error={errors.shipping?.province}
                        required
                      />
                      <Input
                        {...register('shipping.postalCode')}
                        label={'Почтовый индекс'}
                        error={errors.shipping?.postalCode}
                        required
                      />
                    </Stack>
                  </Stack>
                </ShippingWrapper>
              )}
            </AnimatePresence>

            {/* Create Account */}
            {!activeCustomer?.id ? (
              <Stack
                column
                gap="1.25rem"
              >
                <Stack
                  itemsCenter
                  gap="1rem"
                >
                  <CheckBox
                    {...register('createAccount')}
                    label={'Создать аккаунт?'}
                  />
                  <Stack
                    itemsCenter
                    justifyCenter
                  >
                    <Tooltip text={'Аккаунт даёт доступ к истории и статусу заказов. Также позволяет изменять личные данные и адреса.'}>
                      <Info size={12} />
                    </Tooltip>
                  </Stack>
                </Stack>
                {watch('createAccount') && (
                  <CreateAccountWrapper
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      {...register('password')}
                      type="password"
                      label={'Пароль'}
                      error={errors.password}
                      required
                    />
                    <Input
                      {...register('confirmPassword')}
                      type="password"
                      label={'Подтвердите пароль'}
                      error={errors.confirmPassword}
                      required
                    />
                  </CreateAccountWrapper>
                )}
              </Stack>
            ) : null}

            {/* Submit */}
            <Stack
              column
              justifyBetween
              gap="0.5rem"
            >
              <CheckBox
                {...register('terms')}
                // error={errors.terms}
                label={
                  <>
                    Я принимаю{' '}
                    <Link
                      style={{ zIndex: 2, position: 'relative' }}
                      href="/checkout"
                    >
                      условия использования
                    </Link>
                    .
                  </>
                }
                required
              />
              <AnimatePresence>
                {errors.terms?.message && (
                  <FormError
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.terms?.message}
                  </FormError>
                )}
              </AnimatePresence>
            </Stack>
          </Stack>
        </Container>
      </Form>
    </Stack>
  );
};

const Container = styled(Stack)`
    flex-direction: column-reverse;

    @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
        flex-direction: row-reverse;
    }
`;
const DeliveryMethodWrapper = styled(Stack)``;

const LinkButton = styled(Link)`
    width: 100%;
    text-align: center;
    color: ${(p) => p.theme.text.main};
    text-transform: uppercase;
    font-size: 1.5rem;
    font-weight: 600;
`;

const StyledButton = styled(Button)`
    width: 100%;
`;

const BackButton = styled(Link)`
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;

    color: ${({ theme }) => theme.gray(1000)};

    @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
        display: none;
    }
`;

const EmptyCartDescription = styled.div`
    font-size: 1.75rem;

    & > a {
        font-weight: 500;
        font-size: 1.75rem;
        color: ${(p) => p.theme.accent(800)};
        text-decoration: underline;
    }
`;

const BillingWrapper = styled(Stack)`
    margin-top: 1.75rem;
`;

const CreateAccountWrapper = styled(motion.div)`
    display: flex;
    gap: 1.25rem;
`;

const ShippingWrapper = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    margin-top: 1.75rem;
`;

// const FVInputWrapper = styled(motion.div)`
//     margin-top: 1.75rem;
//     position: relative;
// `;

const Form = styled.form`
    margin-top: 1.6rem;
`;
