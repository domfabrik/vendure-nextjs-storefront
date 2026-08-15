import { GraphQLClient } from 'graphql-request';
import { cookies } from 'next/headers';
import { envServer } from '@/shared/config/index.server';

const ENDPOINT = `${envServer.API_URL}?languageCode=RU`;

export const apiClient = new GraphQLClient(ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'vendure-token': 'default-channel',
  },
});

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
