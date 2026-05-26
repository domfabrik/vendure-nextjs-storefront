'use server';

import { apiClient } from '../api-client';
import { type Customer, GET_ACTIVE_CUSTOMER } from './model';

export async function getActiveCustomer(): Promise<Customer | null> {
  const data = await apiClient.request<{ activeCustomer: Customer | null }>(GET_ACTIVE_CUSTOMER);
  return data.activeCustomer;
}
