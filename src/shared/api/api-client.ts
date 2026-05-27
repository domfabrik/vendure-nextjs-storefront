import { GraphQLClient } from 'graphql-request';
import { envServer } from '@/shared/config';

const ENDPOINT = `${envServer.API_URL}?languageCode=RU`;

export const apiClient = new GraphQLClient(ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'vendure-token': 'default-channel',
  },
});
