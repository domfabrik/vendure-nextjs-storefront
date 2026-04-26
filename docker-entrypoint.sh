#!/bin/sh
set -eu

until node -e "const base = (process.env.VENDURE_SERVER_URL || 'http://vendure:3000').replace(/\/shop-api\/?$/, ''); fetch(base + '/shop-api?languageCode=en', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': 'default-channel' }, body: JSON.stringify({ query: '{ __typename }' }) }).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1));"
do
    sleep 3
done

if [ ! -f .next/BUILD_ID ]; then
    npm run build
fi

[ -f .next/prerender-manifest.json ]

if [ -f .next/standalone/server.js ]; then
    exec node .next/standalone/server.js
fi

exec npm run start
