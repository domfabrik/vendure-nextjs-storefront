'use server';

import type { ActiveOrder, Order } from '@/shared/model';

import { apiClient } from '../api-client';
import { GET_ACTIVE_ORDER, GET_ORDER_BY_CODE } from './queries';

export async function getActiveOrder(): Promise<ActiveOrder | null> {
  const data = await apiClient.request<{ activeOrder: ActiveOrder | null }>(GET_ACTIVE_ORDER);
  return data.activeOrder;
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const data = await apiClient.request<{ orderByCode: Order | null }>(GET_ORDER_BY_CODE, { code });
  return data.orderByCode;
}
