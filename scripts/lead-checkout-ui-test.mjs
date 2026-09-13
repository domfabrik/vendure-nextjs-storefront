import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

const capability = 'a'.repeat(64);
const submissions = [];
const receipts = new Map();
const realSubmissions = [];
let realReceipt = null;
let prepareCount = 0;
let behavior = 'success';
let nextOrder = 40;
let slowResponsesSettled = 0;

function resolveBrowserPath() {
  const override = process.env.BROWSER_PATH ?? process.env.EDGE_PATH;
  const names = process.platform === 'linux' ? ['google-chrome', 'microsoft-edge'] : [];
  const candidates = override
    ? [override]
    : process.platform === 'win32'
      ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
      : names.flatMap((name) =>
          (process.env.PATH ?? '')
            .split(delimiter)
            .filter(Boolean)
            .map((directory) => join(directory, name)),
        );
  const browserPath = candidates.find((candidate) => existsSync(candidate));
  assert.ok(browserPath, `Chromium browser not found. Set BROWSER_PATH to a Chrome or Edge executable${override ? ` (invalid override: ${override})` : ''}.`);
  return browserPath;
}

function validateRealLeadApiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('LEAD_TEST_API_URL must be a valid loopback http URL');
  }
  assert.equal(url.protocol, 'http:', 'LEAD_TEST_API_URL must use plain HTTP on loopback');
  assert.ok(['127.0.0.1', 'localhost', '::1'].includes(url.hostname.toLowerCase()), 'LEAD_TEST_API_URL must target loopback only');
  assert.equal(url.username, '', 'LEAD_TEST_API_URL must not contain credentials');
  assert.equal(url.password, '', 'LEAD_TEST_API_URL must not contain credentials');
  assert.equal(url.search, '', 'LEAD_TEST_API_URL must not contain query parameters');
  assert.equal(url.hash, '', 'LEAD_TEST_API_URL must not contain a fragment');
  assert.match(url.pathname, /\/shop-api\/?$/, 'LEAD_TEST_API_URL must target the isolated Vendure shop API');
  return url;
}

// Reject an unsafe destination before building or starting any local server.
const configuredRealLeadApiUrl = process.env.LEAD_TEST_API_URL ? validateRealLeadApiUrl(process.env.LEAD_TEST_API_URL) : null;

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => probe.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

const api = createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  if (behavior.startsWith('real-')) {
    const upstream = await fetch(process.env.LEAD_TEST_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'vendure-token': request.headers['vendure-token'] ?? 'default-channel',
        ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
      },
      body,
    });
    const upstreamBody = await upstream.text();
    const responseHeaders = { 'content-type': upstream.headers.get('content-type') ?? 'application/json' };
    const authToken = upstream.headers.get('vendure-auth-token');
    if (authToken) responseHeaders['vendure-auth-token'] = authToken;
    if (payload.query.includes('SubmitLeadOrder')) {
      realSubmissions.push({ authorization: request.headers.authorization, input: structuredClone(payload.variables.input) });
      const parsed = JSON.parse(upstreamBody);
      if (parsed.data?.submitLeadOrder) realReceipt = parsed.data.submitLeadOrder;
      if (behavior === 'real-lost-once' && realReceipt) {
        behavior = 'real-replay';
        request.socket.destroy();
        return;
      }
    }
    response.writeHead(upstream.status, responseHeaders).end(upstreamBody);
    return;
  }
  if (payload.query.includes('GetAllCollections')) {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { collections: { items: [] } } }));
    return;
  }
  if (payload.query.includes('GetProductBySlug')) {
    const product = {
      id: 'fixture-product',
      slug: 'fixture-chair',
      name: 'Fixture chair',
      description: '',
      optionGroups: [],
      assets: [],
      featuredAsset: null,
      collections: [],
      facetValues: [],
      customFields: {},
      variants: [
        {
          id: '1',
          name: 'Fixture chair',
          sku: 'FIXTURE-1',
          currencyCode: 'RUB',
          basePriceWithTax: 9999,
          priceWithTax: 9999,
          stockLevel: 'IN_STOCK',
          featuredAsset: null,
          assets: [],
          options: [],
          customFields: {},
        },
      ],
    };
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { product } }));
    return;
  }
  if (payload.query.includes('search(')) {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { search: { items: [], totalItems: 0, facetValues: [] } } }));
    return;
  }
  if (payload.query.includes('PrepareLeadOrder')) {
    prepareCount += 1;
    if (behavior === 'prepare-error') {
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ errors: [{ message: 'LEAD_SESSION_REQUIRED' }] }));
      return;
    }
    response
      .writeHead(200, { 'content-type': 'application/json', 'vendure-auth-token': 'ui-harness-session' })
      .end(JSON.stringify({ data: { prepareLeadOrder: { sessionCapability: capability } } }));
    return;
  }
  if (!payload.query.includes('SubmitLeadOrder')) {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: {} }));
    return;
  }
  const input = payload.variables.input;
  submissions.push({ authorization: request.headers.authorization, input: structuredClone(input) });
  if (request.headers.authorization !== 'Bearer ui-harness-session') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ errors: [{ message: 'LEAD_SESSION_REQUIRED' }] }));
    return;
  }
  if (behavior === 'conflict') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ errors: [{ message: 'LEAD_TOKEN_CONFLICT' }] }));
    return;
  }
  if (behavior === 'invalid-input') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ errors: [{ message: 'LEAD_INVALID_INPUT' }] }));
    return;
  }
  if (behavior === 'server-error') {
    response.writeHead(503).end('unavailable');
    return;
  }
  if (behavior === 'malformed-receipt') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(
      JSON.stringify({
        data: {
          submitLeadOrder: {
            orderId: 'wrong-receipt',
            code: 'WRONG',
            currencyCode: 'RUB',
            totalWithTax: 100,
            lines: [{ productVariantId: '999', quantity: 1, unitPriceWithTax: 100, linePriceWithTax: 100 }],
          },
        },
      }),
    );
    return;
  }
  let receipt = receipts.get(input.submissionToken);
  if (!receipt) {
    nextOrder += 1;
    receipt = {
      orderId: String(nextOrder),
      code: `LEAD-${nextOrder}`,
      currencyCode: behavior === 'usd-success' ? 'USD' : 'RUB',
      totalWithTax: 12345,
      lines: input.items.map((item) => ({ ...item, unitPriceWithTax: 12345, linePriceWithTax: 12345 * item.quantity })),
    };
    receipts.set(input.submissionToken, receipt);
  }
  if (behavior === 'lost-once') {
    behavior = 'success';
    request.socket.destroy();
    return;
  }
  if (behavior === 'slow-success') await new Promise((resolve) => setTimeout(resolve, 1800));
  response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ data: { submitLeadOrder: receipt } }));
  if (behavior === 'slow-success') slowResponsesSettled += 1;
});

function run(command, args, env) {
  return spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
}

function waitChild(child, label, output) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => (code === 0 ? resolve() : reject(new Error(`${label} failed (${code ?? signal}): ${output().slice(-3000)}`))));
  });
}

async function waitFor(check, message, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${message}`);
}

async function removeOwnedDirectory(path) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(error?.code) || attempt === 19) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

async function connectCdp(profile, edge) {
  const activePort = join(profile, 'DevToolsActivePort');
  await waitFor(() => existsSync(activePort), 'Edge DevToolsActivePort');
  const [port] = readFileSync(activePort, 'utf8').split(/\r?\n/);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let sequence = 0;
  const pending = new Map();
  const events = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
      else promise.resolve(message.result);
    } else if (message.method === 'Network.loadingFailed' || message.method === 'Runtime.exceptionThrown') {
      events.push(message);
    }
  };
  const call = (method, params = {}) => {
    const id = ++sequence;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  };
  return { socket, call, edge, events };
}

const cartState = {
  state: {
    items: [{ productVariantId: '1', productName: 'Fixture chair', variantName: 'Fixture chair', slug: 'fixture-chair', price: 9999, quantity: 1, image: null }],
    totalQuantity: 1,
    totalPrice: 9999,
  },
  version: 0,
};

async function main() {
  const tsconfigPath = 'tsconfig.json';
  const tsconfigBeforeBuild = readFileSync(tsconfigPath);
  const apiPort = await new Promise((resolve) => api.listen(0, '127.0.0.1', () => resolve(api.address().port)));
  const sitePort = await freePort();
  const env = {
    ...process.env,
    API_URL: `http://127.0.0.1:${apiPort}/shop-api`,
    NEXT_PUBLIC_SITE_URL: 'http://test.domfabrik.ru',
    NEXT_PUBLIC_METRIKA_ID: '112305722',
    NEXT_PUBLIC_GA4_ID: 'G-0M5G35PLZW',
    NEXT_PUBLIC_GA4_ENABLED: 'true',
    NEXT_PUBLIC_GA4_DEBUG: 'true',
    STOREFRONT_ORIGIN: 'https://test.domfabrik.ru',
    INDEXATION_ALLOW: 'false',
    SEO_DIST_DIR: `.next-lead-ui-${process.pid}`,
  };
  let nextOutput = '';
  const build = run(process.execPath, ['node_modules/next/dist/bin/next', 'build'], env);
  build.stdout.on('data', (chunk) => (nextOutput += chunk));
  build.stderr.on('data', (chunk) => (nextOutput += chunk));
  try {
    await waitChild(build, 'Next build', () => nextOutput);
  } finally {
    writeFileSync(tsconfigPath, tsconfigBeforeBuild);
  }
  const next = run(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(sitePort)], env);
  next.stdout.on('data', (chunk) => (nextOutput += chunk));
  next.stderr.on('data', (chunk) => (nextOutput += chunk));
  await waitFor(
    async () => {
      try {
        return (await fetch(`http://127.0.0.1:${sitePort}/cart`)).status === 200;
      } catch {
        return false;
      }
    },
    'Next dev server',
    60_000,
  );

  const browserPath = resolveBrowserPath();
  const profile = mkdtempSync(join(tmpdir(), 'fabric-lead-ui-'));
  const edge = run(
    browserPath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-proxy-server',
      '--remote-debugging-port=0',
      '--host-resolver-rules=MAP test.domfabrik.ru 127.0.0.1, MAP real.test.domfabrik.ru 127.0.0.1',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    process.env,
  );
  const { socket, call, events } = await connectCdp(profile, edge);
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const textIncludes = (text) => evaluate(`document.body?.innerText.includes(${JSON.stringify(text)}) ?? false`);
  const waitText = (text) => waitFor(() => textIncludes(text), `page text: ${text}`);
  const gaEventCount = (name) => evaluate(`(window.gaDataLayer ?? []).filter((args) => args[0] === 'event' && args[1] === ${JSON.stringify(name)}).length`);
  const gaEventPayloads = (name) => evaluate(`(window.gaDataLayer ?? []).filter((args) => args[0] === 'event' && args[1] === ${JSON.stringify(name)}).map((args) => args[2])`);
  const clickText = (text) =>
    evaluate(
      `(() => { const element = [...document.querySelectorAll('button')].find((node) => node.textContent.includes(${JSON.stringify(text)})); if (!element) return false; element.click(); return true; })()`,
    );
  const fill = (label, value) =>
    evaluate(
      `(() => { const input = [...document.querySelectorAll('input')].find((node) => node.labels?.[0]?.textContent.includes(${JSON.stringify(label)})); if (!input) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`,
    );
  const navigate = async (host = 'test.domfabrik.ru') => {
    await call('Page.navigate', { url: `http://${host}:${sitePort}/cart` });
    await waitText('Корзина');
  };
  const seed = async () => {
    await evaluate(`sessionStorage.setItem('__seedLeadCart', '1')`);
    await call('Page.reload');
    await waitText('Оформить заказ');
  };
  const refillCartOnly = async () => {
    await evaluate(`localStorage.setItem('cart-storage', ${JSON.stringify(JSON.stringify(cartState))})`);
    await call('Page.reload');
    await waitText('Оформить заказ');
  };
  const openAndFill = async (name = 'Frontend Fixture') => {
    assert.equal(await clickText('Оформить заказ'), true);
    await waitText('Оформление заявки');
    await waitFor(() => evaluate(`[...document.querySelectorAll('button')].some((node) => node.textContent.includes('Отправить заявку') && !node.disabled)`), 'prepared checkout');
    assert.equal(await fill('Имя', name), true);
    assert.equal(await fill('Телефон', '+70000000000'), true);
  };

  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Network.setBlockedURLs', {
    urls: ['*://mc.yandex.ru/*', '*://mc.yandex.com/*', '*://metrika.yandex.ru/*', '*://yastatic.net/*', '*://www.googletagmanager.com/*', '*://*.google-analytics.com/*'],
  });
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__leadYmCalls = []; window.ym = (...args) => window.__leadYmCalls.push(args); if (sessionStorage.getItem('__seedLeadCart')) { localStorage.removeItem('lead-checkout-attempt-v1'); localStorage.removeItem('lead-checkout-completed-v1'); localStorage.removeItem('metrika-order-request-ids-v1'); localStorage.setItem('cart-storage', ${JSON.stringify(JSON.stringify(cartState))}); sessionStorage.removeItem('__seedLeadCart'); }`,
  });

  try {
    await navigate();
    await waitText('Google Analytics собирает статистику');
    assert.equal(await evaluate('window.gaDataLayer'), undefined, 'Google queue must not exist before consent');
    assert.equal(await evaluate(`document.getElementById('google-analytics-G-0M5G35PLZW') !== null`), false, 'Google script must not load before consent');
    assert.equal(await clickText('Не разрешать Google Analytics'), true);
    assert.equal(await evaluate('window.gaDataLayer'), undefined, 'rejecting Google must not send a consent ping');
    assert.equal(await clickText('Настройки Google Analytics'), true);
    assert.equal(await clickText('Разрешить Google Analytics'), true);
    await waitFor(() => gaEventCount('page_view').then((count) => count === 1), 'first consented GA page_view');
    assert.equal(await evaluate(`document.getElementById('google-analytics-G-0M5G35PLZW') !== null`), true, 'consent loads only the configured test tag');
    assert.deepEqual((await gaEventPayloads('page_view'))[0], {
      page_location: 'https://test.domfabrik.ru/cart',
      page_referrer: '',
      page_title: 'Корзина | Дом Фабрик',
    });
    const initialPageViews = await gaEventCount('page_view');
    await evaluate(`history.pushState({}, '', location.pathname + '?email=private@example.com#secret')`);
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(await gaEventCount('page_view'), initialPageViews, 'query/hash-only changes do not emit another page_view');

    await call('Page.navigate', { url: `http://test.domfabrik.ru:${sitePort}/products/fixture-chair?email=private@example.com#secret` });
    await waitText('Fixture chair');
    await waitFor(() => gaEventCount('view_item').then((count) => count === 1), 'current PDP variant view_item');
    const productPageView = (await gaEventPayloads('page_view'))[0];
    const productViewItem = (await gaEventPayloads('view_item'))[0];
    assert.equal(productPageView.page_location, 'https://test.domfabrik.ru/products/fixture-chair');
    assert.deepEqual(productViewItem.items[0], {
      item_id: '1',
      item_name: 'Fixture chair',
      item_variant: 'Fixture chair',
      price: 99.99,
      quantity: 1,
    });
    assert.doesNotMatch(JSON.stringify([productPageView, productViewItem]), /private@example\.com|\?email=|#secret/);
    await navigate();

    await seed();
    assert.equal(await evaluate(`(() => { const button = document.querySelector('button[aria-label="Увеличить"]'); button?.click(); return !!button; })()`), true);
    await waitFor(() => evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items[0].quantity === 2`), 'cart increase');
    assert.equal(await gaEventCount('add_to_cart'), 1, 'cart increase emits the actual added quantity');
    assert.equal(await evaluate(`(window.gaDataLayer ?? []).filter((args) => args[0] === 'event' && args[1] === 'add_to_cart')[0][2].items[0].quantity`), 1);
    assert.equal(await evaluate(`(() => { const button = document.querySelector('button[aria-label="Уменьшить"]'); button?.click(); return !!button; })()`), true);
    await waitFor(() => evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items[0].quantity === 1`), 'cart decrease');
    assert.equal(await gaEventCount('remove_from_cart'), 1, 'cart decrease emits the actual removed quantity');
    assert.equal(await evaluate(`(window.gaDataLayer ?? []).filter((args) => args[0] === 'event' && args[1] === 'remove_from_cart')[0][2].items[0].quantity`), 1);

    // The backend accepts the first mutation but its response is lost. Immediate double click is one flight.
    behavior = 'lost-once';
    const initialPrepare = prepareCount;
    const initialSubmit = submissions.length;
    const beginCheckoutBefore = await gaEventCount('begin_checkout');
    await openAndFill('Lost Response');
    assert.equal(await gaEventCount('begin_checkout'), beginCheckoutBefore + 1, 'non-empty checkout opening emits one begin_checkout');
    await evaluate(
      `(() => { const button = [...document.querySelectorAll('button')].find((node) => node.textContent.includes('Отправить заявку')); button.click(); button.click(); })()`,
    );
    await waitText('Результат отправки пока неизвестен');
    assert.equal(await gaEventCount('generate_lead'), 0, 'uncertain or failed submit cannot emit a lead before receipt confirmation');
    assert.equal(submissions.length, initialSubmit + 1, 'immediate double click must issue one submit');
    const firstAttempt = submissions.at(-1).input;
    assert.match(firstAttempt.submissionToken, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(firstAttempt.sessionCapability, capability);
    assert.ok(await evaluate(`localStorage.getItem('lead-checkout-attempt-v1') !== null`), 'uncertain attempt must be durable');

    await call('Page.reload');
    await waitText('Оформить заказ');
    assert.equal(await clickText('Оформить заказ'), true);
    await waitText('Повторить отправку');
    assert.equal(prepareCount, initialPrepare + 1, 'remount must not prepare a replacement session for an unresolved attempt');
    await evaluate(
      `(() => { const original = Storage.prototype.removeItem; Storage.prototype.removeItem = function(key) { if (key === 'lead-checkout-attempt-v1') throw new Error('attempt deletion disabled'); return original.call(this, key); }; })()`,
    );
    assert.equal(await clickText('Повторить отправку'), true);
    await evaluate(`window.ym = (...args) => { window.__leadYmCalls.push(args); if (args[2] === 'order_request_submitted') throw new Error('fixture ym failure'); };`);
    await waitText('Заявка LEAD-');
    assert.equal(await gaEventCount('generate_lead'), 1, 'accepted replay receipt emits one generate_lead');
    assert.equal(await gaEventCount('purchase'), 0, 'unpaid request never emits purchase');
    const gaLeadPayload = (await gaEventPayloads('generate_lead'))[0];
    assert.equal(gaLeadPayload.currency, 'RUB');
    assert.equal(gaLeadPayload.value, 123.45);
    assert.equal(gaLeadPayload.page_location, 'https://test.domfabrik.ru/cart');
    assert.doesNotMatch(JSON.stringify(gaLeadPayload), /Lost Response|\+70000000000|submissionToken|private@example\.com/);
    assert.equal(submissions.length, initialSubmit + 2);
    assert.deepEqual(submissions.at(-1).input, firstAttempt, 'retry must preserve exact token, capability and payload');
    assert.equal(submissions.at(-1).authorization, 'Bearer ui-harness-session', 'submit must use the cookie established by prepare');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 0, 'backend receipt must clear the cart immediately');
    assert.equal(JSON.parse(await evaluate(`localStorage.getItem('lead-checkout-attempt-v1')`)).input.submissionToken, firstAttempt.submissionToken);
    assert.equal(
      await evaluate(`JSON.parse(localStorage.getItem('lead-checkout-completed-v1')).includes(${JSON.stringify(firstAttempt.submissionToken)})`),
      true,
      'a completion marker must survive when removing the old attempt fails',
    );
    const firstGoals = await evaluate(`window.__leadYmCalls.filter((call) => call[2] === 'order_request_submitted')`);
    assert.deepEqual(firstGoals, [[112305722, 'reachGoal', 'order_request_submitted', { orderId: '41', value: 123.45, currency: 'RUB' }]]);
    assert.equal(
      JSON.stringify(firstGoals).includes('Lost Response') || JSON.stringify(firstGoals).includes(firstAttempt.submissionToken),
      false,
      'analytics must contain no contact or token',
    );

    const gaEventsBeforeRevocation = {
      pageViews: await gaEventCount('page_view'),
      leads: await gaEventCount('generate_lead'),
      adds: await gaEventCount('add_to_cart'),
      removes: await gaEventCount('remove_from_cart'),
    };
    await evaluate(`document.cookie = '_ga=fixture; path=/'; document.cookie = '_ga_G-0M5G35PLZW=fixture; path=/'; document.cookie = 'store-pref=keep; path=/';`);
    assert.equal(await clickText('Настройки Google Analytics'), true);
    assert.equal(await clickText('Не разрешать Google Analytics'), true);
    assert.equal(await evaluate(`localStorage.getItem('google-analytics-consent-v1')`), 'denied');
    assert.equal(await evaluate(`document.cookie.includes('_ga=') || document.cookie.includes('_ga_G-0M5G35PLZW=')`), false, 'revocation clears only Google Analytics cookies');
    assert.equal(await evaluate(`document.cookie.includes('store-pref=keep')`), true, 'revocation preserves unrelated site cookies');
    assert.deepEqual(
      {
        pageViews: await gaEventCount('page_view'),
        leads: await gaEventCount('generate_lead'),
        adds: await gaEventCount('add_to_cart'),
        removes: await gaEventCount('remove_from_cart'),
      },
      gaEventsBeforeRevocation,
      'revocation suppresses future GA events',
    );
    assert.equal(await evaluate(`window['ga-disable-G-0M5G35PLZW']`), true);

    await call('Page.navigate', { url: `http://test.domfabrik.ru:${sitePort}/products/fixture-chair?email=private@example.com#secret` });
    await waitText('Fixture chair');
    await waitText('Настройки Google Analytics');
    assert.equal(await gaEventCount('view_item'), 0, 'revoked consent suppresses the current PDP item event');
    assert.equal(await gaEventCount('page_view'), 0, 'revoked consent suppresses the current page event');
    assert.equal(await clickText('Настройки Google Analytics'), true);
    assert.equal(await clickText('Разрешить Google Analytics'), true);
    assert.equal(await evaluate(`localStorage.getItem('google-analytics-consent-v1')`), 'granted');
    await waitFor(() => gaEventCount('view_item').then((count) => count === 1), 'current PDP view_item after consent is granted on the PDP');
    assert.equal(await gaEventCount('page_view'), 1, 'current PDP page_view precedes or accompanies its product event');
    assert.equal((await gaEventPayloads('page_view'))[0].page_location, 'https://test.domfabrik.ru/products/fixture-chair');

    await navigate();

    // A genuine next checkout gets a new token and receipt.
    await refillCartOnly();
    behavior = 'usd-success';
    await openAndFill('Second Request');
    assert.equal(await clickText('Отправить заявку'), true);
    await waitText('Заявка LEAD-42');
    const secondAttempt = submissions.at(-1).input;
    assert.notEqual(secondAttempt.submissionToken, firstAttempt.submissionToken);
    assert.equal(await textIncludes('$'), true, 'receipt UI must format the backend currency instead of assuming RUB');
    assert.equal(await evaluate(`window.__leadYmCalls.at(-1)[3].currency`), 'USD');
    assert.equal(await evaluate(`window.__leadYmCalls.filter((call) => call[2] === 'order_request_submitted').length`), 1);
    assert.equal(await gaEventCount('generate_lead'), 0, 'non-RUB backend receipt is not mislabeled as a RUB lead');

    // A malformed success-shaped response remains uncertain and cannot forge success.
    await seed();
    behavior = 'malformed-receipt';
    await openAndFill('Malformed Receipt');
    assert.equal(await clickText('Отправить заявку'), true);
    await waitText('Результат отправки пока неизвестен');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 1);
    assert.ok(await evaluate(`localStorage.getItem('lead-checkout-attempt-v1') !== null`));
    assert.equal(await textIncludes('Заявка LEAD-'), false);

    // GraphQL conflicts never forge success and preserve one frozen attempt across retries/remount.
    await seed();
    behavior = 'conflict';
    const beforeConflictPrepare = prepareCount;
    const beforeConflictSubmit = submissions.length;
    await openAndFill('Conflict Case');
    assert.equal(await clickText('Отправить заявку'), true);
    await waitText('Результат отправки пока неизвестен');
    const conflictAttempt = submissions.at(-1).input;
    assert.equal(await clickText('Повторить отправку'), true);
    await waitFor(() => Promise.resolve(submissions.length === beforeConflictSubmit + 2), 'conflict retry');
    assert.deepEqual(submissions.at(-1).input, conflictAttempt);
    assert.equal(await textIncludes('Заявка LEAD-'), false);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 1);
    await call('Page.reload');
    await waitText('Оформить заказ');
    assert.equal(await clickText('Оформить заказ'), true);
    await waitText('Повторить отправку');
    assert.equal(prepareCount, beforeConflictPrepare + 1);

    // A definite pre-mutation validation result releases the frozen attempt for correction.
    await seed();
    behavior = 'invalid-input';
    await openAndFill('Definite Invalid');
    assert.equal(await clickText('Отправить заявку'), true);
    await waitText('Заявка не была отправлена');
    assert.equal(await evaluate(`localStorage.getItem('lead-checkout-attempt-v1')`), null);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].some((node) => node.textContent.includes('Отправить заявку') && !node.disabled)`), true);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 1);

    // A failed prepare cannot submit, and no replacement attempt is invented.
    await evaluate(`localStorage.removeItem('lead-checkout-attempt-v1')`);
    await call('Page.reload');
    await waitText('Оформить заказ');
    behavior = 'prepare-error';
    const beforePrepareFailureSubmit = submissions.length;
    assert.equal(await clickText('Оформить заказ'), true);
    await waitText('Не удалось подготовить отправку');
    assert.equal(submissions.length, beforePrepareFailureSubmit);
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find((node) => node.textContent.includes('Отправить заявку'))?.disabled`), true);

    // A receipt that arrives after client navigation still reconciles durable state without scheduling obsolete UI work.
    await seed();
    behavior = 'slow-success';
    const beforeSlowSubmit = submissions.length;
    const beforeSlowSettlement = slowResponsesSettled;
    await openAndFill('Late Navigation');
    await evaluate(
      `(() => { const original = window.setTimeout; window.__leadCloseTimers = []; window.setTimeout = function(callback, delay, ...args) { if (delay !== 2500) return original(callback, delay, ...args); const record = { scheduledAt: location.pathname, fired: false }; window.__leadCloseTimers.push(record); return original(() => { record.fired = true; callback(...args); }, delay); }; })()`,
    );
    assert.equal(await clickText('Отправить заявку'), true);
    await waitFor(() => Promise.resolve(submissions.length === beforeSlowSubmit + 1), 'delayed submit to start');
    assert.equal(
      await evaluate(`(() => { const link = [...document.querySelectorAll('a')].find((node) => new URL(node.href).pathname === '/contacts'); link?.click(); return !!link; })()`),
      true,
    );
    await waitFor(() => evaluate(`location.pathname === '/contacts'`), 'NextLink navigation to unmount checkout');
    await waitFor(() => Promise.resolve(slowResponsesSettled === beforeSlowSettlement + 1), 'delayed backend response');
    await waitFor(() => evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length === 0`), 'known receipt reconciliation after checkout unmount');
    assert.equal(await evaluate(`localStorage.getItem('lead-checkout-attempt-v1')`), null);
    assert.deepEqual(await evaluate(`window.__leadCloseTimers`), [], 'an obsolete submit must not schedule or fire the checkout close timer');

    // Storage and analytics exceptions do not invalidate an accepted checkout. Wrong host disables all Metrika calls.
    behavior = 'success';
    await navigate('127.0.0.1');
    await seed();
    await openAndFill('Unavailable Browser Services');
    await evaluate(
      `(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'cart-storage' || key.startsWith('lead-checkout-') || key.startsWith('metrika-order-')) throw new Error('storage disabled'); return original.call(this, key, value); }; window.ym = () => { throw new Error('ym disabled'); }; })()`,
    );
    assert.equal(await clickText('Отправить заявку'), true);
    await waitText('Заявка LEAD-44');
    assert.equal(await textIncludes('Fixture chair'), false, 'accepted receipt must clear in-memory cart even when persistence throws');
    assert.deepEqual(await evaluate(`window.__leadYmCalls ?? []`), [], 'wrong host must not leak an event to a configured counter');

    if (configuredRealLeadApiUrl) {
      behavior = 'real-lost-once';
      await navigate('real.test.domfabrik.ru');
      await seed();
      await openAndFill('Frontend Backend Fixture');
      assert.equal(await clickText('Отправить заявку'), true);
      await waitText('Результат отправки пока неизвестен');
      assert.equal(realSubmissions.length, 1);
      await call('Page.reload');
      await waitText('Оформить заказ');
      assert.equal(await clickText('Оформить заказ'), true);
      await waitText('Повторить отправку');
      assert.equal(await clickText('Повторить отправку'), true);
      await waitText('принята на сумму');
      assert.equal(realSubmissions.length, 2);
      assert.deepEqual(realSubmissions[1].input, realSubmissions[0].input, 'actual backend replay must keep the exact attempt');
      assert.ok(realSubmissions[0].authorization?.startsWith('Bearer '), 'actual submit must use the prepare response cookie');
      assert.ok(realReceipt?.orderId && realReceipt?.code && realReceipt?.currencyCode, 'actual backend must return its durable receipt');
      assert.ok(Number(realReceipt.totalWithTax) > 0, 'actual backend receipt must have a positive total');
      assert.equal(realReceipt.lines?.length, realSubmissions[0].input.items.length, 'actual receipt must preserve line count');
      for (const [index, line] of realReceipt.lines.entries()) {
        assert.equal(line.productVariantId, realSubmissions[0].input.items[index].productVariantId, 'actual receipt variant must match input');
        assert.equal(line.quantity, realSubmissions[0].input.items[index].quantity, 'actual receipt quantity must match input');
        assert.ok(Number(line.linePriceWithTax) > 0, 'actual receipt line total must be positive');
      }
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 0);

      // A later intentional checkout must receive a distinct token and backend order.
      const firstRealOrderId = realReceipt.orderId;
      behavior = 'real-replay';
      await refillCartOnly();
      await openAndFill('Frontend Backend Next Request');
      assert.equal(await clickText('Отправить заявку'), true);
      await waitText('принята на сумму');
      assert.equal(realSubmissions.length, 3, 'next checkout must be one independent submit');
      assert.notEqual(realSubmissions.at(-1).input.submissionToken, realSubmissions[0].input.submissionToken, 'next checkout must use a new token');
      assert.notEqual(realReceipt.orderId, firstRealOrderId, 'next checkout must receive a new backend order');
      assert.equal(await evaluate(`JSON.parse(localStorage.getItem('cart-storage')).state.items.length`), 0);
      console.log(
        `Actual loopback isolated A14 happy path and A15 lost-response/replay passed for orders ${firstRealOrderId}, ${realReceipt.orderId} (${realReceipt.currencyCode}) at ${configuredRealLeadApiUrl.host}`,
      );
    }

    assert.equal(
      events.some((event) => event.method === 'Runtime.exceptionThrown'),
      false,
      'browser runtime must have no uncaught exceptions',
    );
    console.log('Lead checkout actual Next UI/server-action fault matrix passed');
  } finally {
    socket.close();
    edge.kill();
    next.kill();
    await new Promise((resolve) => api.close(resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));
    await removeOwnedDirectory(profile);
    await removeOwnedDirectory(env.SEO_DIST_DIR);
    writeFileSync(tsconfigPath, tsconfigBeforeBuild);
  }
}

await main();
