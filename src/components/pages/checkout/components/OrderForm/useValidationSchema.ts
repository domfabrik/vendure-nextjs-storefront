import * as z from 'zod';

export const useValidationSchema = () => {
  const userObject = z.object({
    emailAddress: z.string().email(),
    firstName: z.string().min(1, { message: 'Имя обязательно' }),
    lastName: z.string().min(1, { message: 'Фамилия обязательна' }),
    phoneNumber: z.string().min(1, { message: 'Телефон обязателен' }).optional(),

    deliveryMethod: z.string().min(1, { message: 'Способ доставки обязателен' }),

    terms: z.boolean().refine((value) => value, { message: 'Необходимо принять условия использования' }),

    shippingDifferentThanBilling: z.boolean(),
    // userNeedInvoice: z.boolean(),
    createAccount: z.boolean().default(false).optional(),

    // NIP: z.string().min(1, { message: "ИНН обязателен" }),
    // password: z.string().min(8, { message: "Пароль обязателен" }),
    // confirmPassword: z.string().min(8, { message: "Подтверждение пароля обязательно" }),
  });

  const billingObject = z.object({
    fullName: z.string().min(1, { message: 'Полное имя обязательно' }),
    streetLine1: z.string().min(1, { message: 'Адрес обязателен' }),
    streetLine2: z.string().optional(),
    city: z.string().min(1, { message: 'Город обязателен' }),
    countryCode: z.string().length(2, { message: 'Страна обязательна' }),
    province: z.string().min(1, { message: 'Область/регион обязательны' }),
    postalCode: z.string().min(1, { message: 'Почтовый индекс обязателен' }),
    company: z.string().optional(),
  });

  const shippingObject = z.object({
    fullName: z.string().min(1, { message: 'Полное имя обязательно' }),
    streetLine1: z.string().min(1, { message: 'Адрес обязателен' }),
    streetLine2: z.string().optional(),
    city: z.string().min(1, { message: 'Город обязателен' }),
    countryCode: z.string().length(2, { message: 'Страна обязательна' }),
    province: z.string().min(1, { message: 'Область/регион обязательны' }),
    postalCode: z.string().min(1, { message: 'Почтовый индекс обязателен' }),
    company: z.string().optional(),
  });

  const billingSchema = z.object({
    shippingDifferentThanBilling: z.literal(false),
    billing: billingObject,
  });
  const shippingSchema = z.object({
    shippingDifferentThanBilling: z.literal(true),
    billing: billingObject,
    shipping: shippingObject,
  });

  const defaultSchema = z.discriminatedUnion('shippingDifferentThanBilling', [billingSchema, shippingSchema]);
  // const NIPSchema = z.discriminatedUnion('userNeedInvoice', [
  //     z.object({
  //         userNeedInvoice: z.literal(true),
  //         NIP: z.string().min(1, { message: "ИНН обязателен" }),
  //     }),
  //     z.object({
  //         userNeedInvoice: z.literal(false),
  //     }),
  // ]);
  const passwordSchema = z
    .discriminatedUnion('createAccount', [
      z.object({
        createAccount: z.literal(true),
        password: z.string().min(8, { message: 'Пароль обязателен' }),
        confirmPassword: z.string().min(8, { message: 'Подтверждение пароля обязательно' }),
      }),
      z.object({
        createAccount: z.literal(false),
      }),
    ])
    .refine((value) => (value.createAccount ? value.password === value.confirmPassword : true), {
      message: 'Пароли не совпадают',
      path: ['confirmPassword'],
    });

  const mainIntersection = z.intersection(defaultSchema, userObject);

  return z.intersection(passwordSchema, mainIntersection);
};
