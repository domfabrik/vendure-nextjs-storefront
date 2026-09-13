import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const configModule = await import('../src/shared/lib/ga4-config.ts');
const consentSource = readFileSync('src/shared/lib/ga4-consent.ts', 'utf8');
const consentModuleUrl = await (async () => {
  const output = ts.transpileModule(consentSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript,${encodeURIComponent(output)}`;
})();
const consentModule = await import(consentModuleUrl);
const ga4Source = readFileSync('src/shared/lib/ga4.ts', 'utf8')
  .replace("from './ga4-consent'", `from ${JSON.stringify(consentModuleUrl)}`)
  .replace("from './ga4-config'", `from ${JSON.stringify(pathToFileURL(resolve('src/shared/lib/ga4-config.ts')).href)}`);
const ga4Output = ts.transpileModule(ga4Source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const ga4Module = await import(`data:text/javascript,${encodeURIComponent(ga4Output)}`);

class StorageMock {
  values = new Map();
  blocked = false;

  getItem(key) {
    if (this.blocked) throw new Error('storage blocked');
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.blocked) throw new Error('storage blocked');
    this.values.set(key, value);
  }
}

const scripts = new Map();
const cookieWrites = [];
const cookieValue = '_ga=old; _ga_G-0M5G35PLZW=session; cartPreference=keep';
const windowListeners = new Map();
globalThis.window = {
  location: { hostname: 'test.domfabrik.ru', pathname: '/search', search: '?email=private@example.com', hash: '#private' },
  localStorage: new StorageMock(),
  addEventListener: (type, listener) => {
    const listeners = windowListeners.get(type) ?? new Set();
    listeners.add(listener);
    windowListeners.set(type, listeners);
  },
  removeEventListener: (type, listener) => windowListeners.get(type)?.delete(listener),
  dispatchEvent: (event) => {
    for (const listener of windowListeners.get(event.type) ?? []) listener.call(window, event);
    return !event.defaultPrevented;
  },
};
globalThis.document = {
  referrer: 'https://search.example/results?q=private@example.com',
  createElement: () => ({ dataset: {} }),
  getElementById: (id) => scripts.get(id) ?? null,
  head: { appendChild: (script) => scripts.set(script.id, script) },
};
Object.defineProperty(document, 'cookie', {
  get: () => cookieValue,
  set: (value) => cookieWrites.push(value),
});

const calls = () => (window.gaDataLayer ?? []).map((entry) => Array.from(entry));
const events = (name) => calls().filter((call) => call[0] === 'event' && call[1] === name);
const currentConfig = (host, id, enabled, debug = 'true') => configModule.resolveGa4Config(host, id, enabled, debug);

assert.equal(currentConfig('domfabrik.ru', configModule.GA4_IDS.production, 'false'), null, 'unset/false release flag disables GA');
assert.equal(currentConfig('localhost', configModule.GA4_IDS.test, 'true'), null, 'unknown host disables GA');
assert.equal(currentConfig('domfabrik.ru', configModule.GA4_IDS.test, 'true'), null, 'test ID cannot run on production host');
assert.equal(currentConfig('test.domfabrik.ru', 'G-INVALID', 'true'), null, 'invalid stream ID disables GA');
assert.equal(currentConfig('test.domfabrik.ru', configModule.GA4_IDS.test, 'true')?.debug, true, 'debug can be enabled on test only');
assert.equal(currentConfig('domfabrik.ru', configModule.GA4_IDS.production, 'true')?.debug, false, 'debug is always off on production');

process.env.NEXT_PUBLIC_GA4_ID = configModule.GA4_IDS.test;
process.env.NEXT_PUBLIC_GA4_ENABLED = 'false';
process.env.NEXT_PUBLIC_GA4_DEBUG = 'true';
assert.equal(ga4Module.isGa4Configured(), false);
assert.equal(ga4Module.startGa4AfterConsent(), false);
assert.equal(window.gaDataLayer, undefined, 'disabled GA must not initialize a transport queue');
assert.equal(scripts.size, 0, 'disabled GA must not load a Google script');

process.env.NEXT_PUBLIC_GA4_ENABLED = 'true';
assert.equal(ga4Module.isGa4Configured(), true);
assert.equal(ga4Module.startGa4AfterConsent(), false, 'missing consent blocks Google initialization');
assert.equal(window.gaDataLayer, undefined, 'no-consent state must not initialize a Google queue');

consentModule.setGa4ConsentChoice('denied');
assert.equal(ga4Module.startGa4AfterConsent(), false, 'rejection blocks Google initialization');
assert.equal(scripts.size, 0, 'rejection must not load gtag.js');
assert.equal(window.gaDataLayer, undefined, 'rejection must not create a Google ping queue');

consentModule.setGa4ConsentChoice('granted');
assert.equal(ga4Module.startGa4AfterConsent(), true);
assert.equal(scripts.size, 1);
assert.match([...scripts.values()][0].src, /id=G-0M5G35PLZW&l=gaDataLayer/);
const queued = calls();
assert.deepEqual(queued[0], ['consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }]);
assert.deepEqual(queued[1], ['consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }]);
const configCall = queued.find((call) => call[0] === 'config');
assert.equal(configCall[1], configModule.GA4_IDS.test);
assert.equal(configCall[2].send_page_view, false);
assert.equal(configCall[2].allow_google_signals, false);
assert.equal(configCall[2].allow_ad_personalization_signals, false);
assert.equal(configCall[2].cookie_domain, 'none', 'GA test cookies must remain scoped to the test host');
assert.equal(configCall[2].debug_mode, true);
assert.equal(configCall[2].page_location, 'https://test.domfabrik.ru/search');
assert.equal(configCall[2].page_referrer, 'https://search.example');
assert.doesNotMatch(JSON.stringify(configCall), /private@example\.com|\?q=|#private/);

window.location.pathname = '/products/chair';
ga4Module.trackGa4PageView('/products/chair?email=private@example.com#secret');
ga4Module.trackGa4PageView('/products/chair?search=private');
assert.equal(events('page_view').length, 1, 'one page view is sent for the initial pathname despite query/hash changes');
assert.equal(events('page_view')[0][2].page_location, 'https://test.domfabrik.ru/products/chair');
assert.equal(events('page_view')[0][2].page_title, 'Товар | Дом Фабрик');
assert.equal(events('page_view')[0][2].page_referrer, 'https://search.example');

window.location.pathname = '/products/next-chair';
ga4Module.trackGa4PageView('/products/next-chair');
assert.equal(events('page_view').length, 2, 'one page view is sent on pathname transition');
assert.equal(events('page_view')[1][2].page_referrer, 'https://test.domfabrik.ru/products/chair', 'SPA referrer is a safe previous page path');
window.location.pathname = '/products/jane%40example.com';
ga4Module.trackGa4PageView('/products/jane%40example.com?phone=123456789');
assert.equal(events('page_view')[2][2].page_location, 'https://test.domfabrik.ru/other', 'unsafe route becomes a safe fallback');
assert.equal(ga4Module.sanitizeGa4Path('/search?query=Иван#contact'), '/search');
assert.equal(ga4Module.sanitizeGa4Path('/unknown/path'), '/other');
assert.equal(
  ga4Module.buildSafeGa4PageContext(currentConfig('test.domfabrik.ru', configModule.GA4_IDS.test, 'true'), '/cart', 'https://test.domfabrik.ru/cart?email=private@example.com')
    .page_referrer,
  'https://test.domfabrik.ru/cart',
);

ga4Module.trackGa4ViewItem(
  Object.assign({ variantId: '801', name: 'Dining chair <script>name</script>', variant: 'Walnut', category: 'Dining', unitPriceMinor: 129990 }, { email: 'private@example.com' }),
);
assert.deepEqual(events('view_item')[0][2].items[0], {
  item_id: '801',
  item_name: 'Dining chair name',
  price: 1299.9,
  quantity: 1,
  item_variant: 'Walnut',
  item_category: 'Dining',
});
ga4Module.trackGa4AddToCart({ productVariantId: '801', productName: 'Dining chair', variantName: 'Walnut', price: 129990, quantity: 2 }, 2);
ga4Module.trackGa4RemoveFromCart({ productVariantId: '801', productName: 'Dining chair', variantName: 'Walnut', price: 129990, quantity: 2 }, 1);
ga4Module.trackGa4AddToCart({ productVariantId: '801', productName: 'Dining chair', variantName: 'Walnut', price: 129990, quantity: 2 }, 0);
assert.equal(events('add_to_cart')[0][2].value, 2599.8);
assert.equal(events('add_to_cart')[0][2].items[0].quantity, 2);
assert.equal(events('remove_from_cart')[0][2].items[0].quantity, 1);
assert.equal(events('add_to_cart').length, 1, 'zero quantity is a no-op');

ga4Module.trackGa4BeginCheckout([
  { productVariantId: '801', productName: 'Dining chair', variantName: 'Walnut', price: 129990, quantity: 2, image: 'https://private.example/picture' },
  { productVariantId: '802', productName: 'Dining table', variantName: 'Oak', price: 79900, quantity: 1 },
]);
assert.equal(events('begin_checkout').length, 1);
assert.equal(events('begin_checkout')[0][2].value, 3398.8);
assert.equal(JSON.stringify(events('begin_checkout')).includes('image'), false, 'cart event uses an explicit item allowlist');

const lead = { orderId: '41', totalWithTax: 12345, currencyCode: 'RUB' };
ga4Module.trackGa4GenerateLead(lead);
ga4Module.trackGa4GenerateLead(lead);
ga4Module.trackGa4GenerateLead({ orderId: '42', totalWithTax: 12345, currencyCode: 'USD' });
assert.equal(events('generate_lead').length, 1, 'same receipt is emitted once and foreign currency is never mislabeled as RUB');
assert.deepEqual(events('generate_lead')[0][2], {
  currency: 'RUB',
  value: 123.45,
  page_location: 'https://test.domfabrik.ru/other',
  page_referrer: 'https://test.domfabrik.ru/products/next-chair',
  page_title: 'Страница | Дом Фабрик',
});
assert.equal(events('purchase').length, 0, 'an unpaid lead is never a purchase');
assert.equal(JSON.stringify(calls()).includes('private@example.com'), false, 'no search query or email value reaches any GA command');

const callsBeforeRevoke = calls().length;
consentModule.setGa4ConsentChoice('denied');
ga4Module.stopGa4AfterRevocation();
ga4Module.trackGa4AddToCart({ productVariantId: '801', productName: 'Dining chair', variantName: 'Walnut', price: 129990, quantity: 1 }, 1);
assert.equal(calls().length, callsBeforeRevoke + 1, 'revocation sends only a consent update');
assert.equal(calls().at(-1)[0], 'consent');
assert.equal(window[`ga-disable-${configModule.GA4_IDS.test}`], true);
assert.ok(
  cookieWrites.every((cookie) => /^_ga(?:_|=)/.test(cookie)),
  'revocation clears only GA cookies',
);

window.localStorage.blocked = true;
consentModule.setGa4ConsentChoice('granted');
assert.equal(consentModule.getGa4ConsentChoice(), 'granted', 'storage errors preserve the current-page decision');
assert.equal(ga4Module.startGa4AfterConsent(), true, 'analytics can activate after an in-page choice when storage is blocked');
ga4Module.trackGa4GenerateLead({ orderId: 'storage-fallback-lead', totalWithTax: 100, currencyCode: 'RUB' });
ga4Module.trackGa4GenerateLead({ orderId: 'storage-fallback-lead', totalWithTax: 100, currencyCode: 'RUB' });
assert.equal(events('generate_lead').filter((call) => call[2].value === 1).length, 1, 'in-memory lead dedupe works when storage is blocked');

const storeMockUrl = `data:text/javascript,${encodeURIComponent(`
export function create() {
  return (initializer) => {
    let state;
    const set = (update) => { state = { ...state, ...(typeof update === 'function' ? update(state) : update) }; };
    const store = () => state;
    store.getState = () => state;
    state = initializer(set);
    return store;
  };
}
export function persist(initializer) { return initializer; }
`)}`;
const sharedLibStubUrl = `data:text/javascript,${encodeURIComponent(`
export const pushEcommerceEvent = () => {};
export const reachGoal = () => {};
export const trackGa4AddToCart = (...args) => globalThis.__ga4Runtime.trackGa4AddToCart(...args);
export const trackGa4RemoveFromCart = (...args) => globalThis.__ga4Runtime.trackGa4RemoveFromCart(...args);
`)}`;
globalThis.__ga4Runtime = ga4Module;
const cartSource = readFileSync('src/shared/store/cart.ts', 'utf8')
  .replace("from 'zustand'", `from ${JSON.stringify(storeMockUrl)}`)
  .replace("from 'zustand/middleware'", `from ${JSON.stringify(storeMockUrl)}`)
  .replace("from '@/shared/lib'", `from ${JSON.stringify(sharedLibStubUrl)}`);
const cartOutput = ts.transpileModule(cartSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const cartModule = await import(`data:text/javascript,${encodeURIComponent(cartOutput)}`);
const cart = cartModule.useCartStore.getState();
cart.addToCart({ productVariantId: '901', productName: 'Chair', variantName: 'Oak', slug: 'chair', price: 10000, image: null }, 2);
cart.setItemQuantity('901', 5);
cart.setItemQuantity('901', 3);
cart.setItemQuantity('901', 3);
cart.removeFromCart('901');
cart.removeFromCart('missing');
cart.clearCart();
assert.equal(events('add_to_cart').filter((call) => call[2].items[0].item_id === '901').length, 2, 'real cart consumer emits additions and increases only');
assert.deepEqual(
  events('remove_from_cart')
    .filter((call) => call[2].items[0].item_id === '901')
    .map((call) => call[2].items[0].quantity),
  [2, 3],
  'real cart consumer emits exact decrease and removal deltas but no no-op/clear event',
);
assert.equal(cartModule.useCartStore.getState().items.length, 0);

const checkoutSource = readFileSync('src/app/cart/checkout-dialog.tsx', 'utf8');
assert.match(checkoutSource, /trackGa4BeginCheckout\(items\)/, 'checkout dialog is wired to the GA begin_checkout emitter');
assert.match(checkoutSource, /trackGa4GenerateLead\(result\.receipt\)/, 'GA lead is wired to the validated success receipt');
assert.doesNotMatch(checkoutSource, /trackGa4GenerateLead\(activeAttempt|trackGa4GenerateLead\(data/, 'failed attempts and contact fields cannot emit a lead');
assert.doesNotMatch(checkoutSource, /purchase\s*:/, 'checkout never creates a purchase event');

console.log('GA4 runtime, privacy, consent, dedupe, and cart consumer checks passed');
