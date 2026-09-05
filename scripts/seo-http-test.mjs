import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import net from 'node:net';
import { resolve } from 'node:path';

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

const api = createServer(async (request, response) => {
  if (request.method !== 'POST') {
    response.writeHead(405).end();
    return;
  }
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
    const isEmpty = variables.input?.collectionSlug === 'empty';
    data = { search: { totalItems: isEmpty ? 0 : 1, items: isEmpty ? [] : [tileProduct()], facetValues: [] } };
  } else {
    data = { search: { totalItems: 0, items: [], facetValues: [] } };
  }
  response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data }));
});

function collection(slug) {
  return { name: slug === 'empty' ? 'Пустая категория' : 'Стулья', slug, description: '', featuredAsset: null, parent: null, children: [] };
}

function tileProduct() {
  return {
    productName: 'Тестовый стул',
    slug: 'test-chair',
    productVariantId: 'variant-1',
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

const sitePort = await freePort();
const apiPort = await new Promise((resolve) => api.listen(0, '127.0.0.1', () => resolve(api.address().port)));
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
  INDEXATION_ALLOW: '1',
  SEO_DIST_DIR: distDir,
};
let next;
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
  const nextMode = 'start';
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', nextMode, '-p', String(sitePort)], { env, stdio: 'inherit' });
  await waitFor(`http://127.0.0.1:${sitePort}/contacts`);

  const metrikaPage = (host) => requestWithHost(sitePort, '/contacts', host);
  const testMetrikaHtml = (await metrikaPage('test.domfabrik.ru')).text();
  assert.match(testMetrikaHtml, /mc\.yandex\.ru\/metrika\/tag\.js\?id=112305722/, 'test host must render test Metrika script');
  assert.match(testMetrikaHtml, /mc\.yandex\.ru\/watch\/112305722/, 'test host must render test Metrika noscript');
  const mismatchedMetrikaHtml = (await metrikaPage('domfabrik.ru')).text();
  assert.doesNotMatch(mismatchedMetrikaHtml, /mc\.yandex\.ru\/(?:metrika\/tag\.js\?id=|watch\/)/, 'host and configured Metrika ID mismatch must disable analytics');
  const spoofedLocalHtml = (await requestWithHost(sitePort, '/contacts', '127.0.0.1')).text();
  assert.doesNotMatch(spoofedLocalHtml, /mc\.yandex\.ru\/(?:metrika\/tag\.js\?id=|watch\/)/, 'localhost must stay disabled');

  for (const userAgent of ['Mozilla/5.0', 'YandexBot/3.0']) {
    const get = (path) => fetch(`http://127.0.0.1:${sitePort}${path}`, { headers: { 'user-agent': userAgent } });
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
    const productHtml = await (await get('/products/test-chair')).text();
    assert.match(productHtml, /<h1[^>]*>Тестовый стул<\/h1>/, `${userAgent} valid product H1`);
    assert.match(productHtml, /"@type":"Product"/, `${userAgent} valid product JSON-LD`);
    assert.match(productHtml, /"lowPrice":10/, `${userAgent} valid product price`);
    for (const path of ['/products/missing', '/collections/missing', '/products/api-error', '/collections/api-error']) {
      const html = await (await get(path)).text();
      assert.equal([...html.matchAll(/<link[^>]+rel="canonical"[^>]+>/g)].length, 0, `${userAgent} error URL must not have canonical`);
    }
    for (const path of ['/search?q=диван', '/cart']) {
      const html = await (await get(path)).text();
      assert.match(html, /name="robots"[^>]+content="[^"]*noindex/i, `${userAgent} noindex ${path}`);
    }
  }
  await stopNext();
  rmSync(distPath, { recursive: true, force: true });
  const prodDistDir = `.next-seo-http-${process.pid}-prod`;
  prodDistPath = resolve(workspaceRoot, prodDistDir);
  assert.equal(existsSync(prodDistDir), false, `${prodDistDir} already exists; refusing to reuse another test run's output`);
  const pathSeparator = process.platform === 'win32' ? '\\' : '/';
  const safeDistPrefix = `${workspaceRoot}${pathSeparator}.next-seo-http-`;
  assert.equal(prodDistPath.startsWith(safeDistPrefix), true, `unsafe test dist path: ${prodDistPath}`);
  const prodSitePort = await freePort();
  env.NEXT_PUBLIC_METRIKA_ID = '110706774';
  env.SEO_DIST_DIR = prodDistDir;
  await run(process.execPath, ['node_modules/next/dist/bin/next', 'build'], env);
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(prodSitePort)], { env, stdio: 'inherit' });
  await waitFor(`http://127.0.0.1:${prodSitePort}/contacts`);
  const prodHtml = (await requestWithHost(prodSitePort, '/contacts', 'domfabrik.ru')).text();
  assert.match(prodHtml, /mc\.yandex\.ru\/metrika\/tag\.js\?id=110706774/, 'production build must render production Metrika script');
  assert.match(prodHtml, /mc\.yandex\.ru\/watch\/110706774/, 'production build must render production Metrika noscript');
  console.log('SEO HTTP integration checks passed');
} finally {
  await stopNext();
  await new Promise((resolve) => api.close(resolve));
  rmSync(distPath, { recursive: true, force: true });
  if (prodDistPath) rmSync(prodDistPath, { recursive: true, force: true });
  writeFileSync(tsconfigPath, tsconfigBeforeBuild);
}
