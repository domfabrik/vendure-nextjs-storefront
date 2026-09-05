import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import net from 'node:net';
import { resolve } from 'node:path';

let searchRequestCount = 0;
let primaryApiRequestCount = 0;

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

async function handleApiRequest(request, response, recordRequest) {
  if (request.method !== 'POST') {
    response.writeHead(405).end();
    return;
  }
  recordRequest(request.url);
  let body = '';
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  const variables = payload.variables ?? {};
  const query = payload.query ?? '';

  if (variables.slug === 'api-error' || variables.collectionSlug === 'api-error') {
    response.writeHead(500).end('mock backend failure');
    return;
  }

  let data;
  if (query.includes('GetProductBySlug')) {
    data = { product: variables.slug === 'missing' ? null : product(variables.slug) };
  } else if (query.includes('GetCollectionBySlug')) {
    data = { collection: variables.slug === 'missing' ? null : collection(variables.slug) };
  } else if (query.includes('GetAllCollections')) {
    data = { collections: { items: [collection('chairs')] } };
  } else if (query.includes('SearchCollectionProducts')) {
    data = { search: { totalItems: variables.collectionSlug === 'empty' ? 0 : 1, items: variables.collectionSlug === 'empty' ? [] : [tileProduct()] } };
  } else if (query.includes('SearchProducts') || query.includes('search(')) {
    searchRequestCount += 1;
    const input = variables.input ?? {};
    if ((input.skip ?? 0) > 2_147_483_647) {
      response.writeHead(400).end('GraphQL Int overflow');
      return;
    }
    const collectionSizes = { chairs: 178, empty: 0, exact: 48, 'one-page': 1 };
    const totalItems = input.collectionSlug ? (collectionSizes[input.collectionSlug] ?? 1) : 1;
    const skip = input.skip ?? 0;
    const take = input.take ?? totalItems;
    const itemCount = Math.max(0, Math.min(take, totalItems - skip));
    const items = Array.from({ length: itemCount }, (_, index) => tileProduct(skip + index + 1));
    data = { search: { totalItems, items, facetValues: [] } };
  } else {
    data = { search: { totalItems: 0, items: [], facetValues: [] } };
  }
  response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data }));
}

const api = createServer((request, response) =>
  handleApiRequest(request, response, () => {
    primaryApiRequestCount += 1;
  }),
);

function collection(slug) {
  return { name: slug === 'empty' ? 'Пустая категория' : 'Стулья', slug, description: '', featuredAsset: null, parent: null, children: [] };
}

function tileProduct(index = 1) {
  return {
    productName: `Тестовый стул ${index}`,
    slug: `test-chair-${index}`,
    productVariantId: `variant-${index}`,
    currencyCode: 'RUB',
    discountPercent: 0,
    basePriceWithTax: { __typename: 'SinglePrice', value: 1000 },
    priceWithTax: { __typename: 'SinglePrice', value: 1000 },
    productAsset: null,
    productVariantName: 'Тестовый стул',
  };
}

function product(slug) {
  return {
    id: 'product-1',
    slug,
    name: 'Тестовый стул',
    description: '',
    assets: [],
    featuredAsset: null,
    customFields: {},
    optionGroups: [],
    collections: [collection('chairs')],
    variants: [
      {
        id: 'variant-1',
        name: 'Основной',
        sku: 'TEST-1',
        currencyCode: 'RUB',
        basePriceWithTax: 1000,
        priceWithTax: 1000,
        stockLevel: 'IN_STOCK',
        featuredAsset: null,
        assets: [],
        options: [],
        customFields: {},
      },
    ],
  };
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status > 0) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not start: ${url}`);
}

function requestWithHost(port, path, host) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: '127.0.0.1', port, path, headers: { host } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve({ status: response.statusCode, text: () => body }));
    });
    request.once('error', reject);
    request.end();
  });
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${code ?? signal})`))));
  });
}

function assertSingleCanonical(html, expected, label) {
  const canonicals = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+>/g)];
  assert.equal(canonicals.length, 1, `${label}: expected exactly one canonical`);
  const href = canonicals[0][0].match(/href="([^"]+)"/)?.[1];
  assert.ok(href, `${label}: canonical has no href`);
  assert.equal(new URL(href).href, new URL(expected, `http://127.0.0.1:${sitePort}`).href, `${label}: wrong canonical`);
}

function decodeHtmlAttribute(value) {
  return value.replaceAll('&amp;', '&');
}

function collectionPageHrefs(html, slug) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => decodeHtmlAttribute(match[1])).filter((href) => href.startsWith(`/collections/${slug}`));
}

function findCollectionPageHref(html, slug, page) {
  return collectionPageHrefs(html, slug).find((href) => {
    const url = new URL(href, 'http://catalog.local');
    return page === 1 ? url.pathname === `/collections/${slug}` && !url.searchParams.has('page') : url.searchParams.get('page') === String(page);
  });
}

const sitePort = await freePort();
const apiPort = await new Promise((resolve) => api.listen(0, '127.0.0.1', () => resolve(api.address().port)));
let primaryApiClosed = false;
let buildApiFallbackTrapListening = false;
let buildApiFallbackRequestCount = 0;
const buildApiFallbackTrap = createServer((request, response) => {
  buildApiFallbackRequestCount += 1;
  response.writeHead(502).end('baked build API fallback trap');
});
let alternateApiRequestCount = 0;
const alternateApi = createServer((request, response) =>
  handleApiRequest(request, response, () => {
    alternateApiRequestCount += 1;
  }),
);
const alternateApiPort = await new Promise((resolve) => alternateApi.listen(0, '127.0.0.1', () => resolve(alternateApi.address().port)));
let publicApiRequestCount = 0;
const publicApiTrap = createServer((request, response) => {
  publicApiRequestCount += 1;
  response.writeHead(502).end('public API hairpin trap');
});
const publicApiPort = await new Promise((resolve) => publicApiTrap.listen(0, '127.0.0.1', () => resolve(publicApiTrap.address().port)));
let slowApiRequestCount = 0;
const slowApi = createServer(async (request, response) => {
  slowApiRequestCount += 1;
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  if (!response.destroyed) response.writeHead(504).end('slow internal API');
});
const slowApiPort = await new Promise((resolve) => slowApi.listen(0, '127.0.0.1', () => resolve(slowApi.address().port)));
const distDir = `.next-seo-http-${process.pid}`;
assert.equal(existsSync(distDir), false, `${distDir} already exists; refusing to reuse another test run's output`);
const workspaceRoot = realpathSync(process.cwd());
const distPath = resolve(workspaceRoot, distDir);
assert.equal(distPath.startsWith(`${workspaceRoot}${process.platform === 'win32' ? '\\' : '/'}.next-seo-http-`), true, `unsafe test dist path: ${distPath}`);
const tsconfigPath = 'tsconfig.json';
const tsconfigBeforeBuild = readFileSync(tsconfigPath);
let prodDistPath;
const env = {
  ...process.env,
  API_URL: `http://127.0.0.1:${apiPort}/shop-api`,
  NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${sitePort}`,
  NEXT_PUBLIC_METRIKA_ID: '112305722',
  NEXT_PUBLIC_HOST: `http://127.0.0.1:${publicApiPort}`,
  VENDURE_SERVER_URL: `http://127.0.0.1:${publicApiPort}`,
  STOREFRONT_ORIGIN: 'https://test.domfabrik.ru',
  INDEXATION_ALLOW: 'false',
  SEO_DIST_DIR: distDir,
};
let next;
async function stripAndAssertStandaloneEnv(buildDistPath, buildEnv) {
  const copiedProductionEnv = resolve(buildDistPath, 'standalone', '.env.production');
  assert.equal(existsSync(copiedProductionEnv), true, 'TC-A1 Next 16 test fixture must demonstrate the copied build dotenv');
  await run(process.execPath, ['scripts/strip-standalone-env.mjs'], buildEnv);
  assert.equal(existsSync(copiedProductionEnv), false, 'TC-A1 standalone artifact must not retain .env.production');
  assert.equal(existsSync(resolve(buildDistPath, 'standalone', '.env')), false, 'TC-A1 standalone artifact must not retain .env');
}

async function startNext(runtimeEnv, port = sitePort) {
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { env: runtimeEnv, stdio: 'inherit' });
  await waitFor(`http://127.0.0.1:${port}/robots.txt`);
}

async function stopNext() {
  if (next && next.exitCode === null) {
    const stopped = new Promise((resolve) => next.once('exit', resolve));
    next.kill('SIGTERM');
    await stopped;
  }
  next = undefined;
}
try {
  await run(process.execPath, ['node_modules/next/dist/bin/next', 'build'], env);
  await stripAndAssertStandaloneEnv(distPath, env);
  const allowedRuntimeEnv = { ...env, STOREFRONT_ORIGIN: 'https://domfabrik.ru', INDEXATION_ALLOW: 'true' };
  await startNext(allowedRuntimeEnv);

  const allowedRobots = await (await fetch(`http://127.0.0.1:${sitePort}/robots.txt`)).text();
  assert.match(allowedRobots, /^User-Agent: \*$/im, 'TC-R1 exact true and production origin must render a wildcard rule');
  assert.match(allowedRobots, /^Allow: \/$/im, 'TC-R1 exact true and production origin must allow crawling');
  assert.doesNotMatch(allowedRobots, /^Disallow:/im, 'TC-R1 allowed robots must not disallow crawling');
  assert.match(allowedRobots, /^Sitemap: https:\/\/domfabrik\.ru\/sitemap\.xml$/im, 'TC-R1 production robots must expose the production sitemap');

  const metrikaPage = (host) => requestWithHost(sitePort, '/contacts', host);
  const testMetrikaHtml = (await metrikaPage('test.domfabrik.ru')).text();
  assert.match(testMetrikaHtml, /mc\.yandex\.ru\/metrika\/tag\.js\?id=112305722/, 'test host must render test Metrika script');
  assert.match(testMetrikaHtml, /mc\.yandex\.ru\/watch\/112305722/, 'test host must render test Metrika noscript');
  const mismatchedMetrikaHtml = (await metrikaPage('domfabrik.ru')).text();
  assert.doesNotMatch(mismatchedMetrikaHtml, /mc\.yandex\.ru\/(?:metrika\/tag\.js\?id=|watch\/)/, 'host and configured Metrika ID mismatch must disable analytics');
  const spoofedLocalHtml = (await requestWithHost(sitePort, '/contacts', '127.0.0.1')).text();
  assert.doesNotMatch(spoofedLocalHtml, /mc\.yandex\.ru\/(?:metrika\/tag\.js\?id=|watch\/)/, 'localhost must stay disabled');

  for (const userAgent of ['Mozilla/5.0', 'YandexBot/3.0']) {
    const get = (path, options = {}) =>
      fetch(`http://127.0.0.1:${sitePort}${path}`, {
        ...options,
        headers: { ...options.headers, 'user-agent': userAgent },
      });
    for (const [path, status] of [
      ['/products/missing', 404],
      ['/collections/missing', 404],
      ['/products/api-error', 500],
      ['/collections/api-error', 500],
      ['/products/test-chair', 200],
      ['/collections/empty', 200],
    ]) {
      assert.equal((await get(path)).status, status, `${userAgent} ${path}`);
    }
    for (const [path, canonical] of [
      ['/', '/'],
      ['/contacts', '/contacts'],
      ['/delivery', '/delivery'],
      ['/about', '/about'],
      ['/how-to-buy', '/how-to-buy'],
      ['/juristic/policy', '/juristic/policy'],
      ['/juristic/returns', '/juristic/returns'],
      ['/juristic/terms', '/juristic/terms'],
      ['/juristic/user-agreement', '/juristic/user-agreement'],
      ['/products/test-chair', '/products/test-chair'],
      ['/collections/empty', '/collections/empty'],
    ]) {
      const response = await get(path);
      assert.equal(response.status, 200, `${userAgent} status ${path}`);
      const html = await response.text();
      assertSingleCanonical(html, canonical, `${userAgent} canonical ${path}`);
    }
    const emptyHtml = await (await get('/collections/empty')).text();
    assert.match(emptyHtml, /Ничего не найдено/, `${userAgent} empty category state`);
    assert.doesNotMatch(emptyHtml, /Тестовый стул|test-chair/, `${userAgent} empty category must not invent products`);
    assert.doesNotMatch(emptyHtml, /noindex/i, `${userAgent} empty category must remain indexable`);

    const firstPageHtml = await (await get('/collections/chairs')).text();
    const pageTwoHref = findCollectionPageHref(firstPageHtml, 'chairs', 2);
    const lastPageHref = findCollectionPageHref(firstPageHtml, 'chairs', 8);
    assert.ok(pageTwoHref, `${userAgent} TC-P1 page 1 must link to page 2`);
    assert.ok(lastPageHref, `${userAgent} TC-P1 page 1 must link to the last page`);
    assert.match(firstPageHtml, /Тестовый стул 1/, `${userAgent} TC-P2 page 1 product set`);
    assert.doesNotMatch(firstPageHtml, /Тестовый стул 25/, `${userAgent} TC-P2 page 1 excludes page 2 products`);
    assertSingleCanonical(firstPageHtml, '/collections/chairs', `${userAgent} TC-P2 page 1 canonical`);

    const secondPageResponse = await get(pageTwoHref);
    assert.equal(secondPageResponse.status, 200, `${userAgent} TC-P1 no-JS page 1 to page 2`);
    const secondPageHtml = await secondPageResponse.text();
    assert.match(secondPageHtml, /Тестовый стул 25/, `${userAgent} TC-P2 page 2 product set`);
    assert.doesNotMatch(secondPageHtml, /Тестовый стул 1</, `${userAgent} TC-P2 page 2 differs from page 1`);
    assertSingleCanonical(secondPageHtml, '/collections/chairs?page=2', `${userAgent} TC-P2 page 2 self-canonical`);
    assert.match(secondPageHtml, /<title>[^<]*страница 2[^<]*<\/title>/i, `${userAgent} TC-P2 page 2 title`);
    assert.ok(findCollectionPageHref(secondPageHtml, 'chairs', 1), `${userAgent} TC-P1 page 2 must link back to page 1`);
    const lastPageFromSecondHref = findCollectionPageHref(secondPageHtml, 'chairs', 8);
    assert.ok(lastPageFromSecondHref, `${userAgent} TC-P1 page 2 must link to the last page`);

    const lastPageResponse = await get(lastPageFromSecondHref);
    assert.equal(lastPageResponse.status, 200, `${userAgent} TC-P1 no-JS page 1 to page 2 to last`);
    const lastPageHtml = await lastPageResponse.text();
    assert.match(lastPageHtml, /Тестовый стул 178/, `${userAgent} TC-P1 last page content`);
    assert.equal(findCollectionPageHref(lastPageHtml, 'chairs', 9), undefined, `${userAgent} TC-P1 next must not exceed last page`);

    const explicitPageOneHtml = await (await get('/collections/chairs?page=1')).text();
    assertSingleCanonical(explicitPageOneHtml, '/collections/chairs', `${userAgent} TC-P2 explicit page 1 canonical`);
    assert.doesNotMatch(explicitPageOneHtml, /<title>[^<]*страница 1[^<]*<\/title>/i, `${userAgent} TC-P2 page 1 title has no suffix`);

    const filterValue = JSON.stringify({ material: ['wood'] });
    const filteredUrl = new URL('/collections/chairs', 'http://catalog.local');
    filteredUrl.searchParams.set('sort', 'price-DESC');
    filteredUrl.searchParams.set('filters', filterValue);
    filteredUrl.searchParams.set('page', '2');
    const filteredHtml = await (await get(`${filteredUrl.pathname}${filteredUrl.search}`)).text();
    for (const targetPage of [1, 3]) {
      const href = findCollectionPageHref(filteredHtml, 'chairs', targetPage);
      assert.ok(href, `${userAgent} TC-P3 filtered page must link to page ${targetPage}`);
      const target = new URL(href, 'http://catalog.local');
      assert.equal(target.searchParams.get('sort'), 'price-DESC', `${userAgent} TC-P3 sort preserved for page ${targetPage}`);
      assert.equal(target.searchParams.get('filters'), filterValue, `${userAgent} TC-P3 filters preserved for page ${targetPage}`);
      assert.equal(
        targetPage === 1 ? target.searchParams.has('page') : target.searchParams.get('page') === String(targetPage),
        targetPage !== 1,
        `${userAgent} TC-P3 page state for ${targetPage}`,
      );
      assert.equal((await get(`${target.pathname}${target.search}`)).status, 200, `${userAgent} TC-P3 navigated URL works for page ${targetPage}`);
    }
    assertSingleCanonical(filteredHtml, '/collections/chairs', `${userAgent} TC-P3 filtered URL keeps base canonical policy`);
    assert.doesNotMatch(filteredHtml, /name="robots"[^>]+content="[^"]*noindex/i, `${userAgent} TC-P3 no mass noindex`);

    for (const invalidPage of ['0', '-1', 'abc', '1.5']) {
      const response = await get(`/collections/chairs?page=${encodeURIComponent(invalidPage)}`, { redirect: 'manual' });
      assert.equal(response.status, 308, `${userAgent} TC-P4 invalid page ${invalidPage} permanent redirect`);
      const target = new URL(response.headers.get('location'), `http://127.0.0.1:${sitePort}`);
      assert.equal(`${target.pathname}${target.search}`, '/collections/chairs', `${userAgent} TC-P4 invalid page ${invalidPage} redirect target`);
      assert.equal((await get(`${target.pathname}${target.search}`, { redirect: 'manual' })).status, 200, `${userAgent} TC-P4 invalid page ${invalidPage} has no redirect loop`);
    }
    for (const repeatedPage of ['/collections/chairs?page=2&page=3', '/collections/chairs?sort=price-DESC&page=2&page=3']) {
      const response = await get(repeatedPage, { redirect: 'manual' });
      assert.equal(response.status, 308, `${userAgent} TC-P4 repeated page permanent redirect`);
      const target = new URL(response.headers.get('location'), `http://127.0.0.1:${sitePort}`);
      assert.equal(target.pathname, '/collections/chairs', `${userAgent} TC-P4 repeated page target path`);
      assert.equal(target.searchParams.has('page'), false, `${userAgent} TC-P4 repeated page removed`);
      if (repeatedPage.includes('sort=')) assert.equal(target.searchParams.get('sort'), 'price-DESC', `${userAgent} TC-P4 redirect preserves sort`);
      assert.equal((await get(`${target.pathname}${target.search}`, { redirect: 'manual' })).status, 200, `${userAgent} TC-P4 repeated page has no redirect loop`);
    }
    assert.equal((await get('/collections/chairs?page=9')).status, 404, `${userAgent} TC-P4 above-last page is 404`);
    assert.equal((await get('/collections/chairs?page=89478487')).status, 404, `${userAgent} TC-P4 page beyond GraphQL range is 404 without an invalid backend query`);
    const searchRequestsBeforeHugePage = searchRequestCount;
    assert.equal((await get('/collections/chairs?page=9007199254740992')).status, 404, `${userAgent} TC-P4 huge positive integer above last page is 404`);
    assert.equal(searchRequestCount, searchRequestsBeforeHugePage, `${userAgent} TC-P4 huge positive integer must not issue a SearchProducts request`);

    const onePageHtml = await (await get('/collections/one-page')).text();
    assert.equal(collectionPageHrefs(onePageHtml, 'one-page').length, 0, `${userAgent} TC-P5 one-page category has no pagination links`);
    assert.equal((await get('/collections/empty?page=2')).status, 404, `${userAgent} TC-P5 empty category page 2 is 404`);

    const exactLastHtml = await (await get('/collections/exact?page=2')).text();
    assert.equal(findCollectionPageHref(exactLastHtml, 'exact', 3), undefined, `${userAgent} TC-P6 exact multiple has no extra page link`);
    assert.equal((await get('/collections/exact?page=3')).status, 404, `${userAgent} TC-P6 exact multiple extra page is 404`);

    assert.match(secondPageHtml, /aria-current="page"[^>]*>2<\//, `${userAgent} TC-P7 active page is exposed`);
    const pageTwoAnchor = [...firstPageHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].find((match) => decodeHtmlAttribute(match[1]) === pageTwoHref)?.[0];
    assert.ok(pageTwoAnchor, `${userAgent} TC-P7 page 2 is an anchor`);
    assert.doesNotMatch(pageTwoAnchor, /tabindex="-1"/, `${userAgent} TC-P7 page 2 link is keyboard reachable`);
    assert.match(
      firstPageHtml,
      /<button\b[^>]*disabled=""[^>]*aria-label="Go to previous page"|<button\b[^>]*aria-label="Go to previous page"[^>]*disabled=""/,
      `${userAgent} TC-P7 previous is disabled on first page`,
    );
    assert.match(
      lastPageHtml,
      /<button\b[^>]*disabled=""[^>]*aria-label="Go to next page"|<button\b[^>]*aria-label="Go to next page"[^>]*disabled=""/,
      `${userAgent} TC-P7 next is disabled on last page`,
    );

    const productHtml = await (await get('/products/test-chair')).text();
    assert.match(productHtml, /<h1[^>]*>Тестовый стул<\/h1>/, `${userAgent} valid product H1`);
    assert.match(productHtml, /"@type":"Product"/, `${userAgent} valid product JSON-LD`);
    assert.match(productHtml, /"lowPrice":10/, `${userAgent} valid product price`);
    assert.doesNotMatch(productHtml, /name="robots"[^>]+content="[^"]*noindex/i, `${userAgent} TC-R4 production product must not receive global noindex`);
    for (const path of ['/products/missing', '/collections/missing', '/products/api-error', '/collections/api-error']) {
      const html = await (await get(path)).text();
      assert.equal([...html.matchAll(/<link[^>]+rel="canonical"[^>]+>/g)].length, 0, `${userAgent} error URL must not have canonical`);
    }
    for (const path of ['/search?q=диван', '/cart']) {
      const html = await (await get(path)).text();
      assert.match(html, /name="robots"[^>]+content="[^"]*noindex/i, `${userAgent} noindex ${path}`);
    }
  }
  for (const testCase of [
    'TC-P1 SSR href traversal',
    'TC-P2 page metadata and products',
    'TC-P3 preserved URL state',
    'TC-P4 page validation',
    'TC-P5 collection boundaries',
    'TC-P6 exact page count',
    'TC-P7 pagination accessibility',
  ]) {
    console.log(`${testCase}: passed for browser and YandexBot HTML`);
  }
  await stopNext();

  for (const [flag, origin, label] of [
    ['false', 'https://domfabrik.ru', 'false flag'],
    ['1', 'https://domfabrik.ru', 'invalid flag'],
    ['true', 'https://test.domfabrik.ru', 'test origin'],
    ['true', 'https://unknown.domfabrik.ru', 'unknown origin'],
  ]) {
    await startNext({ ...env, INDEXATION_ALLOW: flag, STOREFRONT_ORIGIN: origin });
    const deniedRobots = await (await fetch(`http://127.0.0.1:${sitePort}/robots.txt`)).text();
    assert.match(deniedRobots, /^Disallow: \/$/im, `TC-R1 ${label} must disallow crawling`);
    assert.doesNotMatch(deniedRobots, /^Allow:/im, `TC-R1 ${label} must not allow crawling`);
    assert.doesNotMatch(deniedRobots, /^Sitemap:/im, `TC-R1 ${label} must not expose a sitemap`);
    await stopNext();
  }
  const missingFlagEnv = { ...env, STOREFRONT_ORIGIN: 'https://domfabrik.ru' };
  delete missingFlagEnv.INDEXATION_ALLOW;
  await startNext(missingFlagEnv);
  const missingFlagRobots = await (await fetch(`http://127.0.0.1:${sitePort}/robots.txt`)).text();
  assert.match(missingFlagRobots, /^Disallow: \/$/im, 'TC-R1 missing flag must disallow crawling');
  assert.doesNotMatch(missingFlagRobots, /^Allow:|^Sitemap:/im, 'TC-R1 missing flag must not expose allow or sitemap');
  await stopNext();
  console.log('TC-R1 indexation matrix and TC-R2 post-build runtime changes passed');

  await new Promise((resolve) => api.close(resolve));
  primaryApiClosed = true;
  await new Promise((resolve) => buildApiFallbackTrap.listen(apiPort, '127.0.0.1', resolve));
  buildApiFallbackTrapListening = true;

  const primaryRequestsBeforeRuntimeSwitch = primaryApiRequestCount;
  await startNext({ ...env, API_URL: `http://127.0.0.1:${alternateApiPort}/shop-api` });
  const alternateProductResponse = await fetch(`http://127.0.0.1:${sitePort}/products/test-chair`);
  assert.equal(alternateProductResponse.status, 200, 'TC-A2 SSR must use the selected internal runtime API');
  assert.ok(alternateApiRequestCount > 0, 'TC-A2 alternate environment internal API must receive SSR requests');
  assert.equal(primaryApiRequestCount, primaryRequestsBeforeRuntimeSwitch, 'TC-A2 runtime environments must not mix internal API endpoints');
  assert.equal(buildApiFallbackRequestCount, 0, 'TC-A2 SSR must not use the now-failing API endpoint baked into the build');
  assert.equal(publicApiRequestCount, 0, 'TC-A2 unavailable public browser API must receive no SSR requests');
  await stopNext();

  await startNext({ ...env, API_URL: `http://127.0.0.1:${slowApiPort}/shop-api` });
  let timedOut = false;
  try {
    await fetch(`http://127.0.0.1:${sitePort}/products/test-chair`, { signal: AbortSignal.timeout(300) });
  } catch (error) {
    timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
  }
  assert.equal(timedOut, true, 'TC-A3 isolated slow internal API must keep the SSR request pending past the client timeout');
  const settledFailureResponse = await fetch(`http://127.0.0.1:${sitePort}/products/test-chair`);
  assert.ok(settledFailureResponse.status >= 500, 'TC-A3 SSR must surface the settled internal API failure');
  assert.ok(slowApiRequestCount >= 2, 'TC-A3 slow internal API must receive both SSR requests');
  assert.equal(buildApiFallbackRequestCount, 0, 'TC-A3 settled internal failure must not fall back to the baked build API');
  assert.equal(publicApiRequestCount, 0, 'TC-A3 internal API timeout must not fall back to the public hairpin');
  await stopNext();
  console.log('TC-A2 runtime API isolation and TC-A3 no-public-fallback checks passed');

  rmSync(distPath, { recursive: true, force: true });
  const prodDistDir = `.next-seo-http-${process.pid}-prod`;
  prodDistPath = resolve(workspaceRoot, prodDistDir);
  assert.equal(existsSync(prodDistDir), false, `${prodDistDir} already exists; refusing to reuse another test run's output`);
  const pathSeparator = process.platform === 'win32' ? '\\' : '/';
  const safeDistPrefix = `${workspaceRoot}${pathSeparator}.next-seo-http-`;
  assert.equal(prodDistPath.startsWith(safeDistPrefix), true, `unsafe test dist path: ${prodDistPath}`);
  const prodSitePort = await freePort();
  env.API_URL = `http://127.0.0.1:${alternateApiPort}/shop-api`;
  env.NEXT_PUBLIC_METRIKA_ID = '110706774';
  env.STOREFRONT_ORIGIN = 'https://domfabrik.ru';
  env.INDEXATION_ALLOW = 'true';
  env.SEO_DIST_DIR = prodDistDir;
  await run(process.execPath, ['node_modules/next/dist/bin/next', 'build'], env);
  await stripAndAssertStandaloneEnv(prodDistPath, env);
  await startNext(env, prodSitePort);
  const prodHtml = (await requestWithHost(prodSitePort, '/contacts', 'domfabrik.ru')).text();
  assert.match(prodHtml, /mc\.yandex\.ru\/metrika\/tag\.js\?id=110706774/, 'production build must render production Metrika script');
  assert.match(prodHtml, /mc\.yandex\.ru\/watch\/110706774/, 'production build must render production Metrika noscript');
  console.log('SEO HTTP integration checks passed');
} finally {
  await stopNext();
  if (!primaryApiClosed) await new Promise((resolve) => api.close(resolve));
  if (buildApiFallbackTrapListening) await new Promise((resolve) => buildApiFallbackTrap.close(resolve));
  await new Promise((resolve) => alternateApi.close(resolve));
  await new Promise((resolve) => publicApiTrap.close(resolve));
  await new Promise((resolve) => slowApi.close(resolve));
  rmSync(distPath, { recursive: true, force: true });
  if (prodDistPath) rmSync(prodDistPath, { recursive: true, force: true });
  writeFileSync(tsconfigPath, tsconfigBeforeBuild);
}
