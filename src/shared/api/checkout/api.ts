'use server';

import type { PaymentMethod, ShippingMethod } from '@/shared/model';

import { apiClient, sessionRequest } from '../api-client';
import { ADD_ITEM_TO_ORDER, GET_ELIGIBLE_PAYMENT_METHODS, GET_ELIGIBLE_SHIPPING_METHODS, SET_ORDER_CUSTOM_FIELDS } from './queries';

export async function getEligibleShippingMethods(): Promise<ShippingMethod[]> {
  const data = await apiClient.request<{ eligibleShippingMethods: ShippingMethod[] }>(GET_ELIGIBLE_SHIPPING_METHODS);
  return data.eligibleShippingMethods;
}

export async function getEligiblePaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiClient.request<{ eligiblePaymentMethods: PaymentMethod[] }>(GET_ELIGIBLE_PAYMENT_METHODS);
  return data.eligiblePaymentMethods;
}

export interface SubmitOrderItem {
  productVariantId: string;
  quantity: number;
}

export interface SubmitOrderInput {
  items: SubmitOrderItem[];
  recipientFullName: string;
  recipientPhoneNumber: string;
}

export interface SubmitOrderResult {
  success: boolean;
  error?: string;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  try {
    for (const item of input.items) {
      const result = await sessionRequest<{
        addItemToOrder: { id?: string; errorCode?: string; message?: string };
      }>(ADD_ITEM_TO_ORDER, {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      });

      if (result.addItemToOrder.errorCode) {
        return { success: false, error: result.addItemToOrder.message };
      }
    }

    await sessionRequest(SET_ORDER_CUSTOM_FIELDS, {
      input: {
        customFields: {
          recipientFullName: input.recipientFullName,
          recipientPhoneNumber: input.recipientPhoneNumber,
        },
      },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Неизвестная ошибка при оформлении заказа',
    };
  }
}
