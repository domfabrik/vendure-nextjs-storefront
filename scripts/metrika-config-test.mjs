import assert from 'node:assert/strict';

const { METRIKA_IDS, resolveMetrikaConfig } = await import('../src/shared/lib/metrika-config.ts');

const cases = [
  ['domfabrik.ru', String(METRIKA_IDS.production), METRIKA_IDS.production],
  ['test.domfabrik.ru', String(METRIKA_IDS.test), METRIKA_IDS.test],
  ['localhost', String(METRIKA_IDS.production), null],
  ['unknown.example', String(METRIKA_IDS.test), null],
  ['domfabrik.ru', String(METRIKA_IDS.test), null],
  ['test.domfabrik.ru', String(METRIKA_IDS.production), null],
  ['domfabrik.ru', '', null],
  ['test.domfabrik.ru', 'invalid', null],
];

for (const [host, configuredId, expectedId] of cases) {
  assert.equal(resolveMetrikaConfig(host, configuredId)?.id ?? null, expectedId, `${host}/${configuredId}`);
}

const { readFileSync } = await import('node:fs');
const { pathToFileURL } = await import('node:url');
const { resolve } = await import('node:path');
const ts = await import('typescript');
const scriptSource = readFileSync('src/features/metrika/ui/metrika-script.tsx', 'utf8');
const hitSource = readFileSync('src/features/metrika/ui/metrika.tsx', 'utf8');
const ecommerceSource = readFileSync('src/shared/lib/ecommerce.ts', 'utf8');
const ecommerceTestSource = ts.transpileModule(
  ecommerceSource.replace("from './metrika-config';", `from ${JSON.stringify(pathToFileURL(resolve('src/shared/lib/metrika-config.ts')).href)};`),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const { pushEcommerceEvent, reachGoal } = await import(`data:text/javascript,${encodeURIComponent(ecommerceTestSource)}`);
const ymCalls = [];
globalThis.window = {
  location: { hostname: 'test.domfabrik.ru' },
  ym: (...args) => ymCalls.push(args),
  dataLayer: [],
};
process.env.NEXT_PUBLIC_METRIKA_ID = String(METRIKA_IDS.test);
reachGoal('product_detail');
pushEcommerceEvent({ detail: { products: [{ id: 'p1', name: 'Test', price: 10 }] } });
assert.deepEqual(ymCalls, [[METRIKA_IDS.test, 'reachGoal', 'product_detail']]);
const originalEvent = { detail: { products: [{ id: 'p1', name: 'Test', price: 10 }] } };
assert.deepEqual(window.dataLayer, [{ ecommerce: originalEvent }]);
window.ym = undefined;
assert.doesNotThrow(() => reachGoal('ym_not_ready'));
window.ym = (...args) => ymCalls.push(args);
process.env.NEXT_PUBLIC_METRIKA_ID = String(METRIKA_IDS.production);
globalThis.window.location.hostname = 'domfabrik.ru';
reachGoal('production_goal');
assert.deepEqual(ymCalls.at(-1), [METRIKA_IDS.production, 'reachGoal', 'production_goal']);
globalThis.window.location.hostname = 'test.domfabrik.ru';
reachGoal('must_be_disabled');
pushEcommerceEvent({ add: { products: [{ id: 'p1', name: 'Test', price: 10 }] } });
assert.equal(ymCalls.length, 2, 'mismatched host must not call ym');
assert.deepEqual(window.dataLayer, [{ ecommerce: originalEvent }], 'mismatched host must not push ecommerce');
for (const invalidId of ['', 'invalid']) {
  process.env.NEXT_PUBLIC_METRIKA_ID = invalidId;
  reachGoal('invalid_id');
  pushEcommerceEvent({ remove: { products: [{ id: 'p1', name: 'Test', price: 10 }] } });
}
assert.equal(ymCalls.length, 2, 'invalid IDs must not call ym');
assert.deepEqual(window.dataLayer, [{ ecommerce: originalEvent }], 'invalid IDs must not push ecommerce');
assert.match(scriptSource, /resolveMetrikaConfig/);
assert.match(hitSource, /resolveMetrikaConfig/);
assert.match(ecommerceSource, /resolveMetrikaConfig/);
assert.match(scriptSource, /document\.scripts\.length/);
const reactMock = `data:text/javascript,${encodeURIComponent('export let effect; export const useEffect = (callback) => { effect = callback; }; export const useRef = (value) => ({ current: value });')}`;
const navigationMock = `data:text/javascript,${encodeURIComponent("export const usePathname = () => '/test';")}`;
const hitTestSource = ts.transpileModule(
  hitSource
    .replace("from 'next/navigation'", `from ${JSON.stringify(navigationMock)}`)
    .replace("from 'react'", `from ${JSON.stringify(reactMock)}`)
    .replace("from '@/shared/lib'", `from ${JSON.stringify(pathToFileURL(resolve('src/shared/lib/metrika-config.ts')).href)}`),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
).outputText;
const { MetrikaHit } = await import(`data:text/javascript,${encodeURIComponent(hitTestSource)}`);
const reactRuntime = await import(reactMock);
const hitCalls = [];
globalThis.document = { referrer: '' };
for (const [hostname, configuredId, expectedId] of [
  ['domfabrik.ru', String(METRIKA_IDS.production), METRIKA_IDS.production],
  ['test.domfabrik.ru', String(METRIKA_IDS.test), METRIKA_IDS.test],
  ['localhost', String(METRIKA_IDS.production), null],
]) {
  process.env.NEXT_PUBLIC_METRIKA_ID = configuredId;
  globalThis.window = { location: { hostname, href: `https://${hostname}/page` }, ym: (...args) => hitCalls.push(args) };
  MetrikaHit();
  reactRuntime.effect();
  if (expectedId) assert.deepEqual(hitCalls.at(-1), [expectedId, 'hit', `https://${hostname}/page`, { referer: '' }]);
}
assert.equal(hitCalls.length, 2, 'disabled host must not send a hit');
const goalSources = [
  hitSource,
  ecommerceSource,
  readFileSync('src/features/metrika/ui/product-detail-event.tsx', 'utf8'),
  readFileSync('src/shared/store/cart.ts', 'utf8'),
  readFileSync('src/app/cart/cart-page.tsx', 'utf8'),
  readFileSync('src/app/cart/checkout-dialog.tsx', 'utf8'),
].join('\n');
for (const goal of ['product_detail', 'add_to_cart', 'begin_checkout', 'purchase']) assert.match(goalSources, new RegExp(goal));
for (const event of ['detail', 'add', 'remove', 'purchase']) assert.match(ecommerceSource, new RegExp(`\\b${event}\\b`));
console.log('Metrika configuration and browser wiring checks passed');
