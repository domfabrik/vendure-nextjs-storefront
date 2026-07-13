'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { submitOrder } from '@/shared/api';
import { pushEcommerceEvent, reachGoal } from '@/shared/lib';
import { useCartStore } from '@/shared/store';

const checkoutSchema = z.object({
  recipientFullName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  recipientPhoneNumber: z
    .string()
    .min(1, 'Введите номер телефона')
    .regex(/^\+?[0-9\s()-]{7,18}$/, 'Введите корректный номер телефона'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipientFullName: '',
      recipientPhoneNumber: '',
    },
  });

  function handleClose() {
    if (isPending) return;
    if (success) clearCart();
    reset();
    setSuccess(false);
    setError(null);
    onClose();
  }

  function onSubmit(data: CheckoutFormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitOrder({
        items: items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
        recipientFullName: data.recipientFullName,
        recipientPhoneNumber: data.recipientPhoneNumber,
      });

      if (result.success) {
        pushEcommerceEvent({
          purchase: {
            actionField: { id: String(Date.now()) },
            products: items.map((i) => ({ id: i.productVariantId, name: i.productName, price: i.price / 100, variant: i.variantName, quantity: i.quantity })),
          },
        });
        reachGoal('purchase');
        setSuccess(true);
        setTimeout(handleClose, 2000);
      } else {
        setError(result.error ?? 'Не удалось оформить заказ. Попробуйте ещё раз.');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Оформление заказа</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {success && <Alert severity="success">Заказ успешно оформлен!</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {!success && (
            <>
              <TextField
                label="Имя"
                autoFocus
                {...register('recipientFullName')}
                error={!!errors.recipientFullName}
                helperText={errors.recipientFullName?.message}
                disabled={isPending}
              />
              <TextField
                label="Телефон"
                {...register('recipientPhoneNumber')}
                error={!!errors.recipientPhoneNumber}
                helperText={errors.recipientPhoneNumber?.message}
                disabled={isPending}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={isPending}
          >
            Отмена
          </Button>
          {!success && (
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
            >
              {isPending ? 'Отправка...' : 'Отправить'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
