import { GraphQLClient } from 'graphql-request';

const HOST = process.env.NEXT_PUBLIC_HOST ?? 'https://domfabrik.ru';
const ENDPOINT = `${HOST}/shop-api?languageCode=RU`;

export const apiClient = new GraphQLClient(ENDPOINT, {
  headers: {
    'Content-Type': 'application/json',
    'vendure-token': 'default-channel',
  },
});
