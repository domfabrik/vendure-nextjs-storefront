import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runnerPath = fileURLToPath(new URL('./storefront-acceptance-test.mjs', import.meta.url));
function runChild(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => (stdout += chunk));
    child.stderr?.on('data', (chunk) => (stderr += chunk));
    child.on('error', (error) => resolve({ status: null, stdout, stderr: `${stderr}${error.message}` }));
    child.on('exit', (status) => resolve({ status, stdout, stderr }));
  });
}
function fixtureHtml({ canonicalHref = '/', nav = true, emptySearch = false, commercialNoindex = false } = {}) {
  const links = nav
    ? '<nav><a href="/collections/fixture">Каталог</a><a href="/products/fixture-item">Fixture Product</a><a href="/about">О магазине</a><a href="/how-to-buy">Как купить</a><a href="/delivery">Доставка</a><a href="/contacts">Контакты</a></nav>'
    : '<main>Fixture homepage without navigation</main>';
  return `<!doctype html><html><head><link rel="canonical" href="${canonicalHref}">${commercialNoindex ? '<meta name="robots" content="noindex">' : ''}<script src="https://mc.yandex.ru/metrika/tag.js?id=112305722"></script></head><body>${links}<h1>Fixture Product</h1>${emptySearch ? '' : '<a href="/assets/fixture.jpg">image</a>'}</body></html>`;
}
function createAcceptanceFixture({ nav = true, emptySearch = false, wrongCanonical = false, productionPolicy = false, commercialNoindex = false } = {}) {
  const product = {
    id: 'fixture-product-id',
    name: 'Fixture Product',
    slug: 'fixture-item',
    variants: [{ id: 'fixture-variant-id', priceWithTax: 1000, currencyCode: 'RUB', stockLevel: '10', options: [] }],
    featuredAsset: { preview: '/assets/fixture.jpg' },
    assets: [{ preview: '/assets/fixture.jpg' }],
    collections: [{ slug: 'fixture', name: 'Fixture' }],
    facetValues: [],
  };
  const canonical = wrongCanonical ? 'https://wrong.example/' : '/';
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://fixture');
    const send = (status, body, type = 'text/html') => response.writeHead(status, { 'content-type': type }).end(body);
    if (url.pathname === '/shop-api' && request.method === 'POST') {
      let body = '';
      request.on('data', (chunk) => (body += chunk));
      request.on('end', () => {
        if (body.includes('product(')) return send(200, JSON.stringify({ data: { product } }), 'application/json');
        if (body.includes('search(')) {
          return send(
            200,
            JSON.stringify({
              data: {
                search: {
                  totalItems: 1,
                  items: [
                    {
                      productName: product.name,
                      slug: product.slug,
                      productVariantId: product.variants[0].id,
                      currencyCode: 'RUB',
                      priceWithTax: { __typename: 'SinglePrice', value: 10 },
                      facetValueIds: [],
                    },
                  ],
                  facetValues: [],
                },
              },
            }),
            'application/json',
          );
        }
        return send(200, JSON.stringify({ data: {} }), 'application/json');
      });
      return;
    }
    if (url.pathname === '/') return send(200, fixtureHtml({ canonicalHref: canonical, nav, commercialNoindex }));
    if (url.pathname.startsWith('/collections/fixture')) {
      const page = url.searchParams.get('page');
      return send(
        200,
        `<!doctype html><html><head><link rel="canonical" href="${page === '2' ? '/collections/fixture?page=2' : productionPolicy ? '/collections/fixture' : canonical}">${commercialNoindex ? '<meta name="robots" content="noindex">' : ''}</head><body><h1>Fixture</h1><a href="/collections/fixture?page=2">2</a><a href="/products/${page === '2' ? 'fixture-item-page-2' : product.slug}">Fixture Product</a></body></html>`,
      );
    }
    if (url.pathname === '/products/fixture-item')
      return send(
        200,
        `<!doctype html><html><head><link rel="canonical" href="${productionPolicy ? '/products/fixture-item' : canonical}">${commercialNoindex ? '<meta name="robots" content="noindex">' : ''}</head><body><h1>${product.name}</h1><script type="application/ld+json">${JSON.stringify({ '@type': 'Product', name: product.name, offers: { lowPrice: 10, priceCurrency: 'RUB' } })}</script><img src="/assets/fixture.jpg"></body></html>`,
      );
    if (url.pathname.startsWith('/products/')) return send(404, '<!doctype html><html><body>Not found</body></html>');
    if (url.pathname === '/search')
      return send(
        200,
        emptySearch
          ? '<!doctype html><html><body>No products</body></html>'
          : `<!doctype html><html><body><h1>Fixture Product</h1><a href="/products/${product.slug}">${product.name}</a></body></html>`,
      );
    if (url.pathname === '/robots.txt')
      return send(200, productionPolicy ? `User-agent: *\nAllow: /\nSitemap: http://${request.headers.host}/sitemap.xml` : 'User-agent: *\nDisallow: /', 'text/plain');
    if (url.pathname === '/sitemap.xml') return send(200, '<urlset></urlset>', 'application/xml');
    if (url.pathname === '/assets/fixture.jpg') return send(200, 'fixture', 'image/jpeg');
    if (['/about', '/how-to-buy', '/delivery'].includes(url.pathname)) return send(200, '<a href="/contacts">Контакты</a>');
    if (url.pathname === '/contacts') return send(200, '<a href="tel:+79990000000">call</a><a href="mailto:test@example.com">mail</a>');
    if (url.pathname === '/cart') return send(200, '<meta name="robots" content="noindex"><body>Корзина</body>');
    return send(404, '<!doctype html><html><body>Not found</body></html>');
  });
}
async function runFixtureNegative(name, options, expectedId, expectedPattern, extraEnv = {}) {
  const output = mkdtempSync(join(tmpdir(), `fabric-acceptance-${name}-`));
  const server = createAcceptanceFixture(options);
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const port = server.address().port;
  try {
    const result = await runChild(process.execPath, [runnerPath], {
      env: {
        ...process.env,
        BASE_URL: `http://127.0.0.1:${port}`,
        ACCEPTANCE_TIMEOUT_MS: '250',
        BROWSER_PATH: 'C:\\missing\\acceptance-browser',
        ACCEPTANCE_OUT_DIR: output,
        ...extraEnv,
      },
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0, `${name} negative fixture must fail`);
    const report = JSON.parse(readFileSync(join(output, 'report.json'), 'utf8'));
    const failedCase = report.cases.find((testCase) => testCase.id === expectedId);
    assert.equal(failedCase?.status, 'FAIL', `${name} must fail ${expectedId}`);
    assert.match(failedCase.reason, expectedPattern, `${name} must retain the expected failure reason`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(output, { recursive: true, force: true });
  }
}
const runner = readFileSync(runnerPath, 'utf8');
assert.match(runner, /BASE_URL is required/, 'acceptance runner must require an explicit target');
assert.match(runner, /allowedHosts/, 'acceptance runner must enforce an origin allowlist');
assert.match(runner, /isolated-write is forbidden on production/, 'isolated-write must reject production');
assert.match(runner, /Fetch\.enable/, 'browser protection must intercept requests before navigation');
assert.match(runner, /mutation\\b\|submitLeadOrder\|prepareLeadOrder/, 'GraphQL mutation guard must remain explicit');
assert.match(runner, /nextAction/, 'Next-Action header guard must remain explicit');
assert.match(runner, /Next-Action/, 'acceptance probe must use the actual Next-Action transport header');
assert.match(runner, /junit\.xml/, 'runner must emit JUnit evidence');
assert.match(runner, /report\.json/, 'runner must emit JSON evidence');

const leadRunner = readFileSync(fileURLToPath(new URL('./lead-checkout-ui-test.mjs', import.meta.url)), 'utf8');
assert.match(leadRunner, /validateRealLeadApiUrl/, 'isolated lead runner must validate its real API target');
assert.match(leadRunner, /LEAD_TEST_API_URL must target loopback only/, 'isolated lead runner must reject non-loopback API targets');

const rejected = spawnSync(process.execPath, [runnerPath], {
  env: { ...process.env, BASE_URL: 'https://evil.example', ACCEPTANCE_OUT_DIR: '.tmp-acceptance-contract' },
  encoding: 'utf8',
});
assert.notEqual(rejected.status, 0, 'unsafe BASE_URL must fail before any network request');
assert.match(`${rejected.stderr}${rejected.stdout}`, /outside the acceptance allowlist/);

const fixtureOutput = mkdtempSync(join(tmpdir(), 'fabric-acceptance-negative-'));
const fixture = createServer((_request, response) => response.writeHead(500, { 'content-type': 'text/plain' }).end('synthetic API failure'));
await new Promise((resolve, reject) => fixture.listen(0, '127.0.0.1', resolve).once('error', reject));
const fixturePort = fixture.address().port;
try {
  const failed = await runChild(process.execPath, [runnerPath], {
    env: { ...process.env, BASE_URL: `http://127.0.0.1:${fixturePort}`, ACCEPTANCE_OUT_DIR: fixtureOutput },
    encoding: 'utf8',
  });
  assert.notEqual(failed.status, 0, '500 homepage fixture must fail the acceptance runner');
  const negativeReport = JSON.parse(readFileSync(join(fixtureOutput, 'report.json'), 'utf8'));
  assert.equal(negativeReport.cases.length, 18, 'negative report must retain every A01-A18 case');
  assert.equal(new Set(negativeReport.cases.map((testCase) => testCase.id)).size, 18, 'negative report case IDs must be unique');
  assert.equal(negativeReport.cases.find((testCase) => testCase.id === 'A01').status, 'FAIL', 'homepage 500 must fail A01');
  assert.equal(negativeReport.cases.find((testCase) => testCase.id === 'A16').status, 'NOT_RUN', 'homepage failure must not be misattributed to A16');
  assert.match(readFileSync(join(fixtureOutput, 'junit.xml'), 'utf8'), /tests="18"/);
  assert.doesNotMatch(readFileSync(join(fixtureOutput, 'report.json'), 'utf8'), /password|authorization|phone|email/i, 'negative report must not contain secrets or contact data');
} finally {
  await new Promise((resolve) => fixture.close(resolve));
  rmSync(fixtureOutput, { recursive: true, force: true });
}
await runFixtureNegative('broken-nav', { nav: false }, 'A01', /homepage must expose real category and product links/);
await runFixtureNegative('empty-search', { emptySearch: true }, 'A05', /Ничего не найдено/);
await runFixtureNegative('wrong-canonical', { wrongCanonical: true }, 'A11', /canonical/);
await runFixtureNegative('production-commercial-noindex', { productionPolicy: true, commercialNoindex: true }, 'A11', /commercial page/, { ACCEPTANCE_ENV: 'production-fixture' });
await runFixtureNegative('wrong-counter', {}, 'A12', /expected environment analytics ID/, { EXPECTED_METRIKA_ID: '999999999' });
console.log('Acceptance runner safety, behavioral 500 failure, complete matrix and evidence contracts passed');
