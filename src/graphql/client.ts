import { GraphQLError, GraphQLResponse, Thunder, ZeusScalars, chainOptions, fetchOptions } from '@/src/zeus';
import { GetServerSidePropsContext } from 'next';
import { getContext } from '@/src/lib/utils';

let token: string | null = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

const trimShopApiSuffix = (value: string) => value.replace(/\/shop-api\/?$/, '');
const publicVendureHost = trimShopApiSuffix(process.env.NEXT_PUBLIC_HOST ?? 'http://localhost:3000');
const internalVendureHost =
    typeof window === 'undefined'
        ? trimShopApiSuffix(process.env.VENDURE_SERVER_URL ?? publicVendureHost)
        : publicVendureHost;
const internalAssetHost = `${internalVendureHost}/assets`;
const publicAssetHost = `${publicVendureHost}/assets`;

export const scalars = ZeusScalars({
    Money: {
        decode: e => e as number,
    },
    JSON: {
        encode: (e: unknown) => JSON.stringify(JSON.stringify(e)),
        decode: (e: unknown) => JSON.parse(e as string),
    },
    DateTime: {
        decode: (e: unknown) => new Date(e as string).toISOString(),
        encode: (e: unknown) => (e as Date).toISOString(),
    },
});

export const VENDURE_HOST = `${internalVendureHost}/shop-api`;

const rewriteAssetUrls = <T>(value: T): T => {
    if (typeof value === 'string') {
        return value.replaceAll(internalAssetHost, publicAssetHost) as T;
    }
    if (Array.isArray(value)) {
        return value.map(item => rewriteAssetUrls(item)) as T;
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, currentValue]) => [key, rewriteAssetUrls(currentValue)]),
        ) as T;
    }
    return value;
};

const apiFetchVendure =
    (options: fetchOptions) =>
    (query: string, variables: Record<string, unknown> = {}) => {
        const fetchOptions = options[1] || {};
        if (fetchOptions.method && fetchOptions.method === 'GET') {
            return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
                .then(handleFetchResponse)
                .then((response: GraphQLResponse) => {
                    if (response.errors) {
                        throw new GraphQLError(response);
                    }
                    return rewriteAssetUrls(response.data);
                });
        }
        const additionalHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        return fetch(`${options[0]}`, {
            body: JSON.stringify({ query, variables }),
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...additionalHeaders,
            },
            ...fetchOptions,
        })
            .then(r => {
                const authToken = r.headers.get('vendure-auth-token');
                if (authToken != null) {
                    token = authToken;
                }
                return handleFetchResponse(r);
            })
            .then((response: GraphQLResponse) => {
                if (response.errors) {
                    throw new GraphQLError(response);
                }
                return rewriteAssetUrls(response.data);
            });
    };

export const VendureChain = (...options: chainOptions) => Thunder(apiFetchVendure(options));

export const storefrontApiQuery = (ctx: { locale: string; channel: string }) => {
    const HOST = `${VENDURE_HOST}?languageCode=${ctx.locale}`;

    return VendureChain(HOST, {
        headers: {
            'Content-Type': 'application/json',
            'vendure-token': ctx.channel,
        },
    })('query', { scalars });
};

export const storefrontApiMutation = (ctx: { locale: string; channel: string }) => {
    const HOST = `${VENDURE_HOST}?languageCode=${ctx.locale}`;

    return VendureChain(HOST, {
        headers: {
            'Content-Type': 'application/json',
            'vendure-token': ctx.channel,
        },
    })('mutation', { scalars });
};

export const SSGQuery = (params: { locale: string; channel: string }) => {
    const reqParams = {
        locale: params?.locale as string,
        channel: params?.channel as string,
    };

    const HOST = `${VENDURE_HOST}?languageCode=${reqParams.locale}`;
    return VendureChain(HOST, {
        headers: {
            'Content-Type': 'application/json',
            'vendure-token': reqParams.channel,
        },
    })('query', { scalars });
};

export const SSRQuery = (context: GetServerSidePropsContext) => {
    const authCookies = {
        session: context.req.cookies['session'],
        'session.sig': context.req.cookies['session.sig'],
    };

    const ctx = getContext(context);
    const properChannel = ctx?.params?.channel as string;
    const locale = ctx?.params?.locale as string;

    const HOST = `${VENDURE_HOST}?languageCode=${locale}`;
    return VendureChain(HOST, {
        headers: {
            Cookie: `session=${authCookies['session']}; session.sig=${authCookies['session.sig']}`,
            'Content-Type': 'application/json',
            'vendure-token': properChannel,
        },
    })('query', { scalars });
};

export const SSRMutation = (context: GetServerSidePropsContext) => {
    const authCookies = {
        session: context.req.cookies['session'],
        'session.sig': context.req.cookies['session.sig'],
    };

    const ctx = getContext(context);
    const properChannel = ctx?.params?.channel as string;
    const locale = ctx?.params?.locale as string;

    const HOST = `${VENDURE_HOST}?languageCode=${locale}`;
    return VendureChain(HOST, {
        headers: {
            Cookie: `session=${authCookies['session']}; session.sig=${authCookies['session.sig']}`,
            'Content-Type': 'application/json',
            'vendure-token': properChannel,
        },
    })('mutation', { scalars });
};

const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
    if (!response.ok) {
        return new Promise((_, reject) => {
            response
                .text()
                .then(text => {
                    try {
                        reject(JSON.parse(text));
                    } catch (err) {
                        reject(text);
                    }
                })
                .catch(reject);
        });
    }
    return response.json() as Promise<GraphQLResponse>;
};
