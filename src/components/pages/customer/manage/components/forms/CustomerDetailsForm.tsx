import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Stack } from '@/src/components/atoms/Stack';
import { Banner, Input } from '@/src/components/forms';
import { storefrontApiMutation } from '@/src/graphql/client';
import { ActiveCustomerSelector, ActiveCustomerType } from '@/src/graphql/selectors';
import { useChannels } from '@/src/state/channels';
import { Form, MotionCustomerWrap, StyledButton } from '../atoms/shared';

type CustomerDataForm = {
  addressEmail: ActiveCustomerType['emailAddress'];
  firstName: ActiveCustomerType['firstName'];
  lastName: ActiveCustomerType['lastName'];
  phoneNumber: ActiveCustomerType['phoneNumber'];
};

export const CustomerDetailsForm = ({ initialCustomer }: { initialCustomer: ActiveCustomerType }) => {
  const ctx = useChannels();
  const [activeCustomer, setActiveCustomer] = useState<ActiveCustomerType>(initialCustomer);
  const [successBanner, setSuccessBanner] = useState<string>();

  const customerSchema = z.object({
    firstName: z.string().min(1, { message: 'Имя обязательно' }),
    lastName: z.string().min(1, { message: 'Фамилия обязательна' }),
    phoneNumber: z.string().min(1, { message: 'Номер телефона обязателен' }).optional(),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerDataForm>({
    values: {
      addressEmail: activeCustomer?.emailAddress,
      firstName: activeCustomer?.firstName || '',
      lastName: activeCustomer?.lastName || '',
      phoneNumber: activeCustomer?.phoneNumber,
    },
    resolver: zodResolver(customerSchema) as any,
  });

  const onCustomerDataChange: SubmitHandler<CustomerDataForm> = async (input) => {
    const { firstName, lastName, phoneNumber } = input;

    const isDirty = Object.entries(input).every(([key, value]) => value === activeCustomer[key as keyof ActiveCustomerType]);
    if (isDirty) return;

    try {
      const { updateCustomer } = await storefrontApiMutation(ctx)({
        updateCustomer: [{ input: { firstName, lastName, phoneNumber } }, ActiveCustomerSelector],
      });

      if (!updateCustomer) {
        setError('root', { message: 'Неизвестная ошибка' });

        return;
      }

      setActiveCustomer((p) => ({ ...p, ...updateCustomer }));
      setSuccessBanner('Данные аккаунта успешно обновлены');
    } catch {
      setError('root', { message: 'Неизвестная ошибка' });
    }
  };

  const hideSuccessBanner = () => setSuccessBanner(undefined);

  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner(undefined);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  return (
    <>
      <Banner
        clearErrors={hideSuccessBanner}
        success={{ message: successBanner }}
      />
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
          onSubmit={handleSubmit(onCustomerDataChange)}
          noValidate
        >
          <Stack
            gap="2rem"
            column
            itemsCenter
          >
            <Input
              {...register('addressEmail')}
              label={'Email'}
              disabled
            />
            <Stack
              w100
              gap="1.25rem"
            >
              <Input
                label={'Имя'}
                {...register('firstName')}
                error={errors.firstName}
              />
              <Input
                label={'Фамилия'}
                {...register('lastName')}
                error={errors.lastName}
              />
            </Stack>
            <Input
              label={'Телефон'}
              {...register('phoneNumber')}
              error={errors.phoneNumber}
            />
          </Stack>
          <StyledButton
            loading={isSubmitting}
            type="submit"
          >
            {'Изменить данные'}
          </StyledButton>
        </Form>
      </MotionCustomerWrap>
    </>
  );
};
