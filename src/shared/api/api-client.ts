import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';
import { envServer } from '@/shared/config/index.server';
import { attachCatalogRequestID, catalogPropagation } from './catalog-observability';
import type { CatalogOperation, CatalogStage } from './catalog-observability-core';

const ENDPOINT = `${envServer.API_URL}?languageCode=RU`;

export const apiClient = new GraphQLClient(ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'vendure-token': 'default-channel',
  },
});

export function catalogApiRequest<T>(operation: CatalogOperation, stage: CatalogStage, document: string, variables?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const propagation = catalogPropagation(stage, operation);
  return apiClient
    .request<T>({ document, variables, requestHeaders: propagation.headers, signal })
    .then((result) => {
      attachCatalogRequestID(result, propagation.requestID);
      return result;
    })
    .catch((error: unknown) => {
      attachCatalogRequestID(error, propagation.requestID);
      throw error;
    });
}

const AUTH_COOKIE = 'vendure-auth-token';

export async function sessionRequest<T>(document: string, variables?: Record<string, unknown>): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  const requestHeaders: Record<string, string> = {};
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const { data, headers } = await apiClient.rawRequest<T>(document, variables, requestHeaders);

  const newToken = headers.get('vendure-auth-token');
  if (newToken && newToken !== token) {
    cookieStore.set(AUTH_COOKIE, newToken, { httpOnly: true, sameSite: 'lax', path: '/' });
  }

  return data;
}
