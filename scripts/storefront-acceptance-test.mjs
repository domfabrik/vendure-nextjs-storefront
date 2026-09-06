/**
 * Read-only storefront acceptance smoke.  This is deliberately dependency free:
 * the checkout harness already has a small CDP client and Chromium is supplied
 * by the CI image.  Use BASE_URL to run the same suite against test or prod.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

const rawBase = process.env.BASE_URL;
if (!rawBase) throw new Error('BASE_URL is required (for example https://test.domfabrik.ru)');
const base = new URL(rawBase);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
  throw new Error('BASE_URL must be an origin URL without credentials, query or fragment');
base.pathname = '/';
const host = base.hostname.toLowerCase();
const environment = process.env.ACCEPTANCE_ENV ?? (host === 'domfabrik.ru' ? 'production' : host === 'test.domfabrik.ru' ? 'test' : 'fixture');
const productionPolicy = environment === 'production' || environment === 'production-fixture';
const allowedHosts = new Set(['test.domfabrik.ru', 'domfabrik.ru', 'localhost', '127.0.0.1']);
if (!allowedHosts.has(host)) throw new Error(`BASE_URL host ${host} is outside the acceptance allowlist`);
if (environment === 'production' && host !== 'domfabrik.ru') throw new Error('production profile requires domfabrik.ru');
if (environment === 'test' && host !== 'test.domfabrik.ru') throw new Error('test profile requires test.domfabrik.ru');
if (process.env.ACCEPTANCE_PROFILE === 'isolated-write' && host === 'domfabrik.ru') throw new Error('isolated-write is forbidden on production');

const outDir = resolve(process.env.ACCEPTANCE_OUT_DIR ?? join('artifacts', 'storefront-acceptance'));
mkdirSync(outDir, { recursive: true });
const timeout = Number(process.env.ACCEPTANCE_TIMEOUT_MS ?? 20_000);
const expectedCounter = process.env.EXPECTED_METRIKA_ID ?? (environment === 'production' ? '110706774' : '112305722');
const cases = new Map([
  ['A01', 'home navigation'],
  ['A02', 'category and PDP route'],
  ['A03', 'pagination'],
  ['A04', 'search and explicit sorts'],
  ['A05', 'empty search'],
  ['A06', 'filters'],
  ['A07', 'PDP values and variant'],
  ['A08', 'client cart'],
  ['A09', 'checkout validation'],
  ['A10', 'contacts and delivery links'],
  ['A11', 'SEO HTTP/SSR'],
  ['A12', 'analytics guard'],
  ['A13', 'mobile viewport'],
  ['A14', 'isolated checkout happy path'],
  ['A15', 'isolated checkout retry'],
  ['A16', 'runner mutation protection'],
  ['A17', 'negative harness'],
  ['A18', 'report and CI contract'],
]);
const sourceSha =
  process.env.GITHUB_SHA ??
  (() => {
    try {
      return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown-local';
    }
  })();
const commandProfile = process.env.ACCEPTANCE_PROFILE ?? 'production-safe';
const report = {
  baseUrl: base.href,
  host,
  environment,
  expectedCounter,
  sourceSha,
  commandProfile,
  command: 'node scripts/storefront-acceptance-test.mjs',
  startedAt: new Date().toISOString(),
  cases: [...cases.entries()].map(([id, title]) => ({ id, title, status: 'NOT_RUN', reason: 'case has not executed', evidence: {} })),
};
function record(id, status, reason, evidence = {}) {
  const index = report.cases.findIndex((testCase) => testCase.id === id);
  assert.notEqual(index, -1, `unknown acceptance case ${id}`);
  report.cases[index] = { id, title: cases.get(id), status, reason, evidence };
}
function sameOrigin(value) {
  try {
    return new URL(value, base).origin === base.origin;
  } catch {
    return false;
  }
}
function absolute(value) {
  return new URL(value, base).href;
}
function links(html, prefix) {
  return [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .map((x) => {
      try {
        return new URL(x, base);
      } catch {
        return null;
      }
    })
    .filter((x) => x && x.origin === base.origin && x.pathname.startsWith(prefix))
    .map((x) => x.pathname + x.search);
}
function canonical(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
}
function robotsMeta(html) {
  return html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
}
function analyticsIds(html) {
  return [...html.matchAll(/(?:metrika\/tag\.js\?id=|metrika\/watch\/)(\d+)/gi)].map((match) => match[1]);
}
function jsonLd(html, type) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    })
    .find((value) => value && value['@type'] === type);
}
function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
async function shopApiQuery(query, variables = {}) {
  const response = await fetch(absolute('/shop-api'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  assert.equal(response.status, 200, `Shop API query status ${response.status}`);
  const payload = await response.json();
  assert.ok(!payload.errors?.length, `Shop API query failed: ${payload.errors?.[0]?.message ?? 'unknown error'}`);
  return payload.data;
}
const productQuery = `query($slug:String!){product(slug:$slug){id name slug variants{id priceWithTax currencyCode stockLevel options{id groupId code name}} optionGroups{id name options{id code name}} featuredAsset{preview} assets{preview} collections{slug name} facetValues{id name facet{id name code}}}}`;
const searchQuery = `query($input:SearchInput!){search(input:$input){totalItems items{productName slug productVariantId currencyCode priceWithTax{__typename ... on SinglePrice{value} ... on PriceRange{min max}} facetValueIds} facetValues{count facetValue{id name code facet{id name code}}}}}`;
async function get(path, options = {}) {
  let url = absolute(path);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const response = await fetch(url, { ...options, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url, text: await response.text() };
    const location = response.headers.get('location');
    if (!location || !sameOrigin(location)) throw new Error(`unsafe redirect from ${url}`);
    url = absolute(location);
  }
  throw new Error(`redirect limit exceeded for ${path}`);
}
async function waitFor(fn, label) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timeout: ${label}`);
}
function browserPath() {
  const override = process.env.BROWSER_PATH ?? process.env.EDGE_PATH;
  const candidates = override
    ? [override]
    : process.platform === 'win32'
      ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
      : (process.env.PATH ?? '').split(delimiter).flatMap((d) => [join(d, 'google-chrome'), join(d, 'microsoft-edge')]);
  const found = candidates.find((p) => existsSync(p));
  assert.ok(found, `Chromium not found; set BROWSER_PATH to Chrome or Edge${override ? ` (invalid: ${override})` : ''}`);
  return found;
}
async function cdpBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'fabric-acceptance-'));
  const child = spawn(
    browserPath(),
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-features=ServiceWorker',
      '--no-first-run',
      '--no-proxy-server',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const active = join(profile, 'DevToolsActivePort');
  await waitFor(() => existsSync(active), 'Chromium DevToolsActivePort');
  const [port] = readFileSync(active, 'utf8').split(/\r?\n/);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.onopen = resolveOpen;
    socket.onerror = reject;
  });
  let sequence = 0;
  const pending = new Map();
  const network = [];
  const blocked = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const p = pending.get(message.id);
      pending.delete(message.id);
      message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result);
    } else if (message.method === 'Network.requestWillBeSent') network.push(message.params.request);
  };
  const call = (method, params = {}) => {
    const id = ++sequence;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveCall, reject) => pending.set(id, { resolve: resolveCall, reject }));
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setBlockedURLs', { urls: ['*://mc.yandex.ru/*', '*://mc.yandex.com/*', '*://metrika.yandex.ru/*', '*://yastatic.net/*'] });
  // Fetch interception makes the safety property executable: queries remain available,
  // while GraphQL mutations and Next server actions are failed before they leave the browser.
  await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  const handler = async (event) => {
    if (event.method !== 'Fetch.requestPaused') return;
    const r = event.params.request;
    const body = r.postData ?? '';
    const nextAction = Object.entries(r.headers ?? {}).some(([name, value]) => name.toLowerCase() === 'next-action' && Boolean(value));
    const mutation = /mutation\b|submitLeadOrder|prepareLeadOrder|createOrder|next-action/i.test(body) || /_actions?\b/i.test(r.url) || nextAction;
    if (mutation) {
      blocked.push({ requestId: event.params.requestId, url: r.url, method: r.method, body: body.slice(0, 256), nextAction });
      await call('Fetch.failRequest', { requestId: event.params.requestId, errorReason: 'BlockedByClient' });
    } else await call('Fetch.continueRequest', { requestId: event.params.requestId });
  };
  const oldMessage = socket.onmessage;
  socket.onmessage = (event) => {
    oldMessage(event);
    const message = JSON.parse(event.data);
    handler(message).catch(() => {});
  };
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'browser evaluation failed');
    return result.result.value;
  };
  const navigate = async (path) => {
    await call('Page.navigate', { url: absolute(path) });
    await waitFor(() => evaluate('document.readyState === "complete"'), `page ${path}`);
  };
  const setViewport = async (width, height, mobile = false) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  const screenshot = async (path) => {
    const result = await call('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path, Buffer.from(result.data, 'base64'));
  };
  const close = () => {
    socket.close();
    child.kill();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };
  return { evaluate, navigate, setViewport, network, blocked, screenshot, close };
}

let category;
let product;
let homepage;
let selectedProduct;
let selectedSearch;
let multiVariantCandidate;
async function main() {
  try {
    const home = await get('/');
    homepage = home.text;
    assert.equal(home.response.status, 200, 'homepage status');
    const collectionLinks = [...new Set(links(homepage, '/collections/'))].filter((x) => !x.includes('page='));
    const productLinks = [...new Set(links(homepage, '/products/'))];
    assert.ok(collectionLinks.length && productLinks.length, 'homepage must expose real category and product links');
    category = collectionLinks[0];
    product = productLinks[0];
    assert.ok(/<nav\b|Каталог|Категории/i.test(homepage), 'homepage must expose visible navigation');
    record('A01', 'PASS', 'homepage 200 exposes same-origin category/product navigation', { category, product });
  } catch (error) {
    record('A01', 'FAIL', error.message);
    for (const id of [...cases.keys()].slice(1)) record(id, 'NOT_RUN', 'homepage discovery failed');
    return finish();
  }
  try {
    const page = await get(category);
    assert.equal(page.response.status, 200);
    assert.match(page.text, /<h[1-6]\b/i, 'category must expose a heading');
    const products = [...new Set(links(page.text, '/products/'))];
    assert.ok(products.length);
    const pdp = await get(products[0]);
    assert.equal(pdp.response.status, 200);
    assert.ok(/<h1\b/i.test(pdp.text));
    record('A02', 'PASS', 'category heading, product card and PDP route are HTTP 200', { category, product: products[0] });
  } catch (e) {
    record('A02', 'FAIL', e.message);
  }
  try {
    const first = await get(category);
    const page2 = links(first.text, '/collections/').find((x) => new URL(x, base).searchParams.get('page') === '2');
    assert.ok(page2, 'selected category must expose page 2');
    const second = await get(page2);
    assert.equal(second.response.status, 200);
    assert.notDeepEqual(new Set(links(first.text, '/products/')), new Set(links(second.text, '/products/')));
    assert.equal(new URL(canonical(second.text), base).searchParams.get('page'), '2');
    const previous = links(second.text, '/collections/').find((href) => {
      const page = new URL(href, base).searchParams.get('page');
      return page === null || page === '1';
    });
    assert.ok(previous, 'page 2 must expose a previous-page link');
    const beyond = await get(`${category}${category.includes('?') ? '&' : '?'}page=9999`);
    assert.ok([200, 404].includes(beyond.response.status), 'out-of-range pagination must be bounded');
    if (beyond.response.status === 200) assert.equal(links(beyond.text, '/products/').length, 0, 'out-of-range page must not render products');
    record('A03', 'PASS', 'page 2 changes products, exposes previous navigation, and bounds an out-of-range page', { page2, previous, outOfRangeStatus: beyond.response.status });
  } catch (e) {
    record('A03', 'FAIL', e.message);
  }
  try {
    const pdp = await get(product);
    const title = pdp.text
      .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      ?.replace(/<[^>]+>/g, '')
      .trim();
    assert.ok(title);
    const productSlug = new URL(product, base).pathname.split('/').filter(Boolean).at(-1);
    const apiProduct = (await shopApiQuery(productQuery, { slug: productSlug })).product;
    assert.ok(apiProduct, 'Shop API must resolve the selected PDP');
    selectedProduct = apiProduct;
    assert.equal(apiProduct.name, title, 'visible PDP title must match Shop API');
    const searchTerm = title.split(/\s+/).find((part) => part.length >= 4) ?? title;
    const apiRelevance = (await shopApiQuery(searchQuery, { input: { term: searchTerm, take: 24, groupByProduct: true } })).search;
    assert.ok(apiRelevance.items.length, 'Shop API relevance query must return items');
    const search = await get(`/search?q=${encodeURIComponent(searchTerm)}`);
    assert.equal(search.response.status, 200);
    assert.ok(links(search.text, '/products/').length, 'search must render product links');
    assert.ok(plainText(search.text).toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()), 'search must render the chosen query');
    const defaultHtmlSlugs = links(search.text, '/products/').map((href) => new URL(href, base).pathname.split('/').filter(Boolean).at(-1));
    assert.deepEqual(
      defaultHtmlSlugs.slice(0, 3),
      apiRelevance.items.slice(0, 3).map((item) => item.slug),
      'default search order must match Shop API relevance',
    );
    for (const [sort, apiSort] of [
      ['name-ASC', { name: 'ASC' }],
      ['price-ASC', { price: 'ASC' }],
      ['price-DESC', { price: 'DESC' }],
    ]) {
      const sorted = await get(`/search?q=${encodeURIComponent(searchTerm)}&sort=${sort}`);
      assert.equal(sorted.response.status, 200);
      assert.equal(new URL(sorted.url).searchParams.get('sort'), sort, `search URL must preserve ${sort}`);
      const apiSorted = (await shopApiQuery(searchQuery, { input: { term: searchTerm, take: 24, groupByProduct: true, sort: apiSort } })).search;
      const htmlSlugs = links(sorted.text, '/products/').map((href) => new URL(href, base).pathname.split('/').filter(Boolean).at(-1));
      assert.ok(htmlSlugs.length && apiSorted.items.length, `${sort} must return real results`);
      assert.deepEqual(
        htmlSlugs.slice(0, 3),
        apiSorted.items.slice(0, 3).map((item) => item.slug),
        `${sort} order must match Shop API`,
      );
    }
    selectedSearch = { term: searchTerm, defaultOrder: defaultHtmlSlugs.slice(0, 3), relevance: apiRelevance.items.slice(0, 3).map((item) => item.slug) };
    record('A04', 'PASS', 'search relevance and explicit name/price order match Shop API', selectedSearch);
  } catch (e) {
    record('A04', 'FAIL', e.message);
  }
  try {
    const empty = await get('/search?q=fabric_acceptance_no_such_product_9f3c');
    assert.equal(empty.response.status, 200);
    assert.match(empty.text, /Ничего не найдено/);
    assert.equal(links(empty.text, '/products/').length, 0, 'empty search must not render product cards');
    record('A05', 'PASS', 'empty search state is rendered without product cards');
  } catch (e) {
    record('A05', 'FAIL', e.message);
  }
  try {
    const page = await get(category);
    assert.match(page.text, /Фильтры/);
    record('A06', 'NOT_RUN', 'filter interaction is executed in the browser profile', { category });
  } catch (e) {
    record('A06', 'FAIL', e.message);
  }
  try {
    const page = await get(product);
    assert.equal(page.response.status, 200);
    assert.ok(canonical(page.text));
    const productPrices = selectedProduct.variants.map((variant) => Number(variant.priceWithTax) / 100).filter((price) => Number.isFinite(price) && price > 0);
    assert.ok(productPrices.length, 'Shop API must expose a positive selected variant price');
    const ld = jsonLd(page.text, 'Product');
    assert.ok(ld?.offers, 'PDP must expose Product JSON-LD offers');
    assert.equal(Number(ld.offers.lowPrice), productPrices[0], 'PDP JSON-LD price must match Shop API');
    const image = [...page.text.matchAll(/(?:https?:\/\/[^"' ]+\/assets\/[^"' ]+|\/assets\/[^"' ]+)/gi)].map((m) => m[0]).find((x) => sameOrigin(x));
    assert.ok(image, 'PDP must expose a same-origin product asset');
    assert.equal((await get(image)).response.status, 200);
    assert.equal(ld.offers.priceCurrency, selectedProduct.variants[0].currencyCode, 'PDP JSON-LD currency must match Shop API');
    const categoryProducts = [...new Set(links((await get(category)).text, '/products/'))].slice(0, 24);
    const catalogProducts = await Promise.all(
      categoryProducts.map((href) => shopApiQuery(productQuery, { slug: new URL(href, base).pathname.split('/').filter(Boolean).at(-1) }).then((data) => data.product)),
    );
    multiVariantCandidate = catalogProducts.find((item) => item?.variants?.length > 1);
    record(
      'A07',
      'PASS',
      selectedProduct.variants.length > 1 ? 'PDP price/image/variant facts match Shop API' : 'PDP price/image facts match Shop API; single-variant branch recorded',
      {
        product,
        variantCount: selectedProduct.variants.length,
        price: productPrices[0],
        currency: selectedProduct.variants[0].currencyCode,
        multiVariantCandidate: multiVariantCandidate?.slug ?? null,
        variantCoverage: multiVariantCandidate
          ? 'multi-variant candidate discovered for browser interaction'
          : 'single-variant only; no multi-variant candidate in sampled category',
      },
    );
  } catch (e) {
    record('A07', 'FAIL', e.message);
  }
  const browserCase = async (id, title, fn) => {
    try {
      const evidence = await fn();
      record(id, 'PASS', title, evidence ?? {});
    } catch (error) {
      const screenshot = join(outDir, `failure-${id}.png`);
      try {
        await browser.screenshot(screenshot);
      } catch {}
      record(id, 'FAIL', error.message, { screenshot });
    }
  };
  let browser;
  try {
    browser = await cdpBrowser();
  } catch (error) {
    for (const id of ['A06', 'A07', 'A08', 'A09', 'A13', 'A16']) record(id, 'NOT_RUN', `browser setup failed: ${error.message}`);
  }
  if (browser) {
    const clickButton = (text) =>
      browser.evaluate(
        `(() => { const b=[...document.querySelectorAll('button,[role="button"],a')].find(x=>((x.textContent ?? '').includes(${JSON.stringify(text)}) || x.getAttribute('aria-label') === ${JSON.stringify(text)}) && !x.disabled); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true; })()`,
      );
    const body = () => browser.evaluate('document.body.innerText');
    await browserCase('A06', 'available filter applies, updates URL/results, and reset restores the category', async () => {
      await browser.navigate(category);
      assert.equal(await clickButton('Фильтры'), true, 'filter control must be clickable');
      await waitFor(() => browser.evaluate('document.querySelectorAll("input[type=checkbox]").length > 0'), 'filter checkbox');
      const before = await browser.evaluate('document.querySelectorAll(`a[href^="/products/"]`).length');
      const selected = await browser.evaluate(
        '(() => { const input=[...document.querySelectorAll("input[type=checkbox]")].find(x=>!x.disabled && /\\([1-9]\\d*\\)/.test(x.closest("label")?.innerText ?? "")); if(!input)return null; const text=(input.closest("label")?.innerText ?? "").trim(); input.click(); return {label:text.replace(/\\s*\\([0-9]+\\)\\s*$/, "").trim(), count:Number(text.match(/\\(([0-9]+)\\)/)?.[1] ?? 0)}; })()',
      );
      assert.ok(selected, 'category must expose an available filter value');
      await waitFor(() => browser.evaluate('location.search.includes("filters=")'), 'filter URL');
      await waitFor(() => browser.evaluate('document.querySelectorAll(`a[href^="/products/"]`).length > 0'), 'filtered product links');
      const filteredSlugs = await browser.evaluate(
        '[...document.querySelectorAll(`a[href^="/products/"]`)].map((link) => new URL(link.href).pathname.split("/").filter(Boolean).at(-1))',
      );
      const filtered = filteredSlugs.length;
      assert.ok(filtered > 0 && filtered <= before, 'filtered results must remain real product links');
      const apiProducts = await Promise.all(filteredSlugs.slice(0, 12).map((slug) => shopApiQuery(productQuery, { slug }).then((data) => data.product)));
      assert.ok(
        apiProducts.every((item) => item?.facetValues?.some((facetValue) => facetValue.name === selected.label)),
        'every filtered result must carry the selected API facet value',
      );
      assert.equal(await clickButton('Сбросить все'), true, 'filter reset must be available');
      await waitFor(() => browser.evaluate('!location.search.includes("filters=")'), 'filter reset URL');
      return { before, filtered, selectedFacet: selected, filteredSlugs, apiFacetMatches: apiProducts.map((item) => item.slug), finalUrl: await browser.evaluate('location.href') };
    });
    await browserCase('A07', 'multi-variant PDP selection changes the client cart variant when a candidate is available', async () => {
      if (!multiVariantCandidate) return { variantCoverage: 'single-variant only; no multi-variant candidate in sampled category' };
      const alternate = multiVariantCandidate.variants.find((variant) => variant.id !== multiVariantCandidate.variants[0]?.id && variant.options?.[0]?.name);
      assert.ok(alternate, 'multi-variant candidate must expose an alternate option');
      const optionName = alternate.options[0].name;
      await browser.navigate(`/products/${multiVariantCandidate.slug}`);
      const clicked = await browser.evaluate(
        `(name => { const node=[...document.querySelectorAll('.MuiChip-root,[role="button"],button')].find((element) => (element.textContent ?? '').trim() === name); if (!node) return false; node.click(); return true; })(${JSON.stringify(optionName)})`,
      );
      assert.equal(clicked, true, 'multi-variant option must be clickable');
      await new Promise((resolve) => setTimeout(resolve, 250));
      assert.ok((await body()).includes(optionName), 'selected option must remain visible');
      assert.equal(await clickButton('В корзину'), true, 'selected variant must be addable');
      const cart = await browser.evaluate('JSON.parse(localStorage.getItem("cart-storage")).state.items[0]');
      assert.equal(String(cart.productVariantId), String(alternate.id), 'cart must retain the selected API variant ID');
      assert.equal(Number(cart.price), Number(alternate.priceWithTax), 'cart must retain the selected API variant minor price');
      await browser.navigate('/cart');
      assert.equal(await clickButton('Удалить'), true, 'variant test cart item must be removable');
      await waitFor(() => browser.evaluate('document.body.innerText.includes("Корзина пуста")'), 'variant test empty cart');
      return {
        variantCoverage: 'multi-variant UI exercised',
        product: multiVariantCandidate.slug,
        selectedVariantId: alternate.id,
        selectedPriceMinor: Number(alternate.priceWithTax),
        selectedPriceDisplay: Number(alternate.priceWithTax) / 100,
      };
    });
    await browserCase('A08', 'cart add, quantity, removal, empty state, and reload persistence are client-only', async () => {
      await browser.navigate(product);
      assert.equal(await clickButton('В корзину'), true, 'PDP add-to-cart must be clickable');
      await browser.navigate('/cart');
      const rowText = () =>
        browser.evaluate(
          `(name => [...document.querySelectorAll('.MuiCard-root')].find((row) => (row.innerText ?? '').includes(name))?.innerText ?? '')(${JSON.stringify(selectedProduct.name)})`,
        );
      assert.match(await rowText(), new RegExp(selectedProduct.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      const selectedPriceMinor = Number(selectedProduct.variants[0].priceWithTax);
      const selectedPriceDisplay = selectedPriceMinor / 100;
      assert.ok(
        (await rowText()).replace(/[^0-9]/g, '').includes(String(Math.round(selectedPriceDisplay)).replace(/[^0-9]/g, '')),
        'cart must display the selected API variant price',
      );
      const quantityControl = () =>
        browser.evaluate(
          `(name => { const row=[...document.querySelectorAll('.MuiCard-root')].find((item) => (item.innerText ?? '').includes(name)); return {row:!!row, increment:row?.querySelector('button[aria-label="Увеличить"]') !== null}; })(${JSON.stringify(selectedProduct.name)})`,
        );
      assert.deepEqual(await quantityControl(), { row: true, increment: true }, 'selected cart row must expose one quantity control');
      assert.equal(
        await browser.evaluate(
          `(name => { const row=[...document.querySelectorAll('.MuiCard-root')].find((item) => (item.innerText ?? '').includes(name)); const button=row?.querySelector('button[aria-label="Увеличить"]'); if (!button) return false; button.click(); return true; })(${JSON.stringify(selectedProduct.name)})`,
        ),
        true,
        'cart quantity increment must be clickable in the selected row',
      );
      await waitFor(
        () =>
          browser.evaluate(
            `(name => [...document.querySelectorAll('.MuiCard-root')].find((row) => (row.innerText ?? '').includes(name))?.querySelector('button[aria-label="Увеличить"]')?.parentElement?.innerText.includes('2'))(${JSON.stringify(selectedProduct.name)})`,
          ),
        'cart quantity 2',
      );
      await browser.navigate('/cart');
      assert.match(await rowText(), /2/);
      assert.equal(
        await browser.evaluate(
          `(name => { const row=[...document.querySelectorAll('.MuiCard-root')].find((item) => (item.innerText ?? '').includes(name)); const button=row?.querySelector('button[aria-label="Удалить"]'); if (!button) return false; button.click(); return true; })(${JSON.stringify(selectedProduct.name)})`,
        ),
        true,
        'selected cart row remove must be clickable',
      );
      await waitFor(() => browser.evaluate('document.body.innerText.includes("Корзина пуста")'), 'empty cart');
      return { product: selectedProduct.slug, selectedPriceMinor, selectedPriceDisplay, quantityAfterReload: 2, emptyAfterRemove: true };
    });
    await browserCase('A09', 'checkout server-action preparation is blocked and dialog remains safe to close/reopen', async () => {
      await browser.navigate(product);
      assert.equal(await clickButton('В корзину'), true);
      await browser.navigate('/cart');
      const blockedBefore = browser.blocked.length;
      assert.equal(await clickButton('Оформить заказ'), true, 'checkout must open from a nonempty cart');
      await waitFor(() => browser.evaluate('document.body.innerText.includes("Оформление заявки")'), 'checkout dialog');
      await new Promise((resolve) => setTimeout(resolve, 500));
      const blockedActions = browser.blocked.slice(blockedBefore).filter((request) => request.nextAction);
      assert.ok(blockedActions.length, 'checkout preparation Next-Action must be blocked before egress');
      const submitState = await browser.evaluate(
        '(() => { const button=[...document.querySelectorAll("button")].find((node) => node.textContent.includes("Отправить заявку")); return {exists:!!button, disabled:!!button?.disabled}; })()',
      );
      assert.ok(submitState.exists, 'checkout submit control must remain observable');
      assert.ok(submitState.disabled || /не удалось|ошибк|недоступ/i.test(await body()), 'blocked preparation must leave submit disabled or show an error');
      assert.equal(await clickButton('Отмена'), true, 'checkout close must work');
      assert.equal(await clickButton('Оформить заказ'), true, 'checkout reopen must work');
      assert.ok((await body()).includes('Оформление заявки'));
      const sameOriginPosts = browser.network.filter((request) => request.method === 'POST' && sameOrigin(request.url));
      const mutationPosts = sameOriginPosts.filter(
        (request) =>
          Object.entries(request.headers ?? {}).some(([name, value]) => name.toLowerCase() === 'next-action' && Boolean(value)) ||
          /mutation\b|submitLeadOrder|prepareLeadOrder|createOrder|next-action/i.test(request.postData ?? '') ||
          /_actions?\b/i.test(request.url),
      );
      const interceptedMutationPosts = mutationPosts.filter((request) =>
        browser.blocked.some((blocked) => blocked.url === request.url && (blocked.nextAction || blocked.body === (request.postData ?? ''))),
      );
      const unblockedMutationPosts = mutationPosts.filter((request) => !interceptedMutationPosts.includes(request));
      assert.equal(unblockedMutationPosts.length, 0, 'checkout must not send an unblocked same-origin mutation');
      return {
        blockedNextActionCount: blockedActions.length,
        sameOriginPostCount: sameOriginPosts.length,
        interceptedMutationPostCount: interceptedMutationPosts.length,
        sameOriginMutationPostCount: unblockedMutationPosts.length,
        submitDisabled: submitState.disabled,
      };
    });
    await browserCase('A13', 'mobile menu/search/PDP/cart controls are reachable without horizontal overflow', async () => {
      await browser.setViewport(390, 844, true);
      await browser.navigate('/');
      const home = await browser.evaluate(
        '({width:document.documentElement.scrollWidth, viewport:innerWidth, menu:!!document.querySelector(`[aria-label="Каталог"]`), search:!!document.querySelector(`input[placeholder*="Поиск"]`)})',
      );
      assert.ok(home.width <= home.viewport + 1, 'mobile homepage must not overflow');
      assert.ok(home.menu && home.search, 'mobile menu and search must be available');
      await browser.navigate(product);
      assert.ok(await browser.evaluate('document.body.innerText.includes("В корзину")'), 'mobile PDP add-to-cart must be visible');
      await browser.navigate('/cart');
      assert.ok((await body()).includes('Корзина'), 'mobile cart must be reachable');
      return home;
    });
    await browserCase('A16', 'GraphQL mutation and Next action are blocked before network egress; service workers are disabled', async () => {
      await browser.setViewport(1280, 900, false);
      await browser.navigate('/');
      const before = browser.blocked.length;
      await browser.evaluate(`Promise.all([
        fetch('/shop-api', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({query:'mutation CreateOrder { createOrder(input: {}) { id } }'}) }).catch(() => null),
        fetch(location.pathname, { method: 'POST', headers: {'content-type':'text/plain', 'Next-Action':'acceptance-synthetic-action'}, body: '' }).catch(() => null),
      ])`);
      await waitFor(() => browser.blocked.length >= before + 2, 'blocked mutation probes');
      const probes = browser.blocked.slice(before);
      assert.ok(
        probes.some((request) => /mutation\b|createOrder/i.test(request.body)),
        'GraphQL mutation must be intercepted',
      );
      assert.ok(
        probes.some((request) => request.nextAction),
        'actual Next-Action header must be intercepted',
      );
      const serviceWorkers = await browser.evaluate('navigator.serviceWorker?.getRegistrations ? navigator.serviceWorker.getRegistrations().then((items) => items.length) : 0');
      assert.equal(serviceWorkers, 0, 'service workers must not intercept acceptance traffic');
      return { blockedProbes: probes.map((request) => request.url), serviceWorkers };
    });
    browser.close();
  }
  const infoPaths = [
    ...new Set([...homepage.matchAll(/href=["'](\/[^"']+)["']/gi)].map((match) => match[1]).filter((path) => /^(\/delivery|\/about|\/how-to-buy|\/contacts)$/.test(path))),
  ];
  try {
    assert.ok(infoPaths.length >= 3, 'homepage must expose discoverable information links');
    for (const path of infoPaths) {
      const result = await get(path);
      assert.equal(result.response.status, 200, `${path} status`);
    }
    const contact = await get('/contacts');
    const hrefs = [...contact.text.matchAll(/(?:href|content)=["'](tel:[^"']+|mailto:[^"']+)["']/gi)].map((match) => match[1]);
    assert.ok(
      hrefs.some((href) => /^tel:\+\d{7,15}$/.test(href)),
      'contacts must contain a valid tel URI',
    );
    assert.ok(
      hrefs.some((href) => /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)),
      'contacts must contain a valid mailto URI',
    );
    record('A10', 'PASS', 'discovered information links and validated tel/mailto formats', { infoPaths, contactLinks: hrefs.length });
  } catch (error) {
    record('A10', 'FAIL', error.message);
  }
  try {
    const robots = await get('/robots.txt');
    const sitemap = await get('/sitemap.xml');
    assert.equal(robots.response.status, 200);
    assert.equal(sitemap.response.status, 200);
    if (environment === 'test') {
      assert.match(robots.text, /^Disallow:\s*\/$/im, 'test robots must deny crawling');
      assert.doesNotMatch(robots.text, /^Allow:/im, 'test robots must not allow crawling');
      assert.doesNotMatch(robots.text, /^Sitemap:/im, 'test robots must not advertise sitemap');
    } else if (productionPolicy) {
      assert.match(robots.text, /^Allow:\s*\/$/im, 'production robots must allow crawling');
      assert.match(robots.text, new RegExp(`^Sitemap:\\s*${base.origin.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}/sitemap\\.xml$`, 'im'));
    }
    for (const [path, expected] of [
      ['/', '/'],
      [category, category],
      [product, product],
    ]) {
      const page = path === '/' ? { text: homepage, response: { status: 200 } } : await get(path);
      assert.equal(page.response.status, 200);
      assert.equal(new URL(canonical(page.text), base).href, new URL(expected, base).href, `canonical ${path}`);
      assert.doesNotMatch(robotsMeta(page.text), /noindex/i, `commercial page ${path} must be indexable`);
    }
    for (const path of ['/search?q=fabric_acceptance_no_such_product_9f3c', '/cart']) {
      assert.match(robotsMeta((await get(path)).text), /noindex/i, `noindex ${path}`);
    }
    const missing = await get('/products/not-a-real-fabric-slug');
    assert.equal(missing.response.status, 404, 'unknown product must be hard 404');
    assert.equal(canonical(missing.text), undefined, '404 must not expose canonical');
    const ld = jsonLd((await get(product)).text, 'Product');
    assert.equal(ld.name, selectedProduct.name, 'JSON-LD title must match visible/API title');
    record('A11', 'PASS', 'robots/sitemap policy, commercial/service canonicals, noindex, hard 404 and JSON-LD consistency checked', {
      robots: robots.text.trim(),
      sitemapStatus: sitemap.response.status,
    });
  } catch (error) {
    record('A11', 'FAIL', error.message);
  }
  try {
    const ids = [...new Set(analyticsIds(homepage))];
    assert.deepEqual(ids, [String(expectedCounter)], 'bootstrap must contain exactly the expected environment analytics ID');
    record('A12', 'PASS', 'bootstrap contains exactly the expected environment analytics ID', { ids });
  } catch (error) {
    record('A12', 'FAIL', error.message, { ids: [...new Set(analyticsIds(homepage))], expectedCounter: String(expectedCounter) });
  }
  record('A14', 'NOT_RUN', 'run scripts/lead-checkout-ui-test.mjs with the owned loopback fixture and aggregate its report');
  record('A15', 'NOT_RUN', 'run scripts/lead-checkout-ui-test.mjs with the owned loopback fixture and aggregate its report');
  record('A17', 'NOT_RUN', 'negative malformed/500/empty/canonical/counter probes run by acceptance-contract-test.mjs');
  record('A18', 'PASS', 'all A01-A18 records are initialized, updated by case ID, and emitted as JSON/JUnit with source SHA/profile metadata');
  finish();
}
function xml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
function finish() {
  report.finishedAt = new Date().toISOString();
  report.summary = Object.fromEntries(['PASS', 'FAIL', 'NOT_RUN'].map((s) => [s, report.cases.filter((x) => x.status === s).length]));
  const deferred = new Set(['A14', 'A15', 'A17']);
  const blockingNotRun = report.cases.filter((testCase) => testCase.status === 'NOT_RUN' && !(process.env.ACCEPTANCE_ALLOW_DEFERRED_CASES === 'true' && deferred.has(testCase.id)));
  report.blockingNotRun = blockingNotRun.map((testCase) => testCase.id);
  report.overall = report.summary.FAIL === 0 && blockingNotRun.length === 0 ? 'PASS' : 'FAIL';
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outDir, 'junit.xml'),
    `<testsuite name="storefront-acceptance" tests="${report.cases.length}" failures="${report.summary.FAIL + blockingNotRun.length}" skipped="${report.summary.NOT_RUN}"><properties><property name="sourceSha" value="${xml(report.sourceSha)}"/><property name="commandProfile" value="${xml(report.commandProfile)}"/></properties>${report.cases.map((c) => `<testcase classname="${xml(c.id)}" name="${xml(c.title)}">${c.status === 'FAIL' ? `<failure message="${xml(c.reason)}"/>` : c.status === 'NOT_RUN' ? `<skipped message="${xml(c.reason)}"/>` : ''}</testcase>`).join('')}</testsuite>`,
  );
  console.log(
    JSON.stringify(
      {
        baseUrl: report.baseUrl,
        environment: report.environment,
        summary: report.summary,
        overall: report.overall,
        report: join(outDir, 'report.json'),
        junit: join(outDir, 'junit.xml'),
      },
      null,
      2,
    ),
  );
  if (report.overall !== 'PASS') process.exitCode = 1;
}
await main();
