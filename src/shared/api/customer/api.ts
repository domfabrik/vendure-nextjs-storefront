'use server';

import type { Customer } from '@/shared/model';

import { apiClient } from '../api-client';
import { GET_ACTIVE_CUSTOMER } from './queries';

export async function getActiveCustomer(): Promise<Customer | null> {
  const data = await apiClient.request<{ activeCustomer: Customer | null }>(GET_ACTIVE_CUSTOMER);
  return data.activeCustomer;
}
