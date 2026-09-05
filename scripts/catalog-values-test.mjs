import assert from 'node:assert/strict';
import { normalizeCatalogBrand, normalizeCatalogStock, normalizeCurrencyCode, normalizeMinorPrice } from '../src/shared/lib/catalog-values.ts';
import { priceFormatter } from '../src/shared/lib/price-formatter.ts';
import { serializeJsonLd } from '../src/shared/lib/serialize-json-ld.ts';
import { stripHtml } from '../src/shared/lib/strip-html.ts';

assert.equal(normalizeCatalogBrand(null), undefined, 'TC-1 absent brand stays absent');
assert.equal(normalizeCatalogBrand('   '), undefined, 'TC-1 blank brand stays absent');
assert.equal(normalizeCatalogBrand('  Actual Brand  '), 'Actual Brand', 'TC-1 known brand is preserved');

for (const [input, expected] of [
  ['IN_STOCK', { kind: 'in-stock', purchasable: true, schemaAvailability: 'https://schema.org/InStock' }],
  ['LOW_STOCK', { kind: 'low-stock', purchasable: true, schemaAvailability: 'https://schema.org/InStock' }],
  ['OUT_OF_STOCK', { kind: 'out-of-stock', purchasable: false, schemaAvailability: 'https://schema.org/OutOfStock' }],
  ['0', { kind: 'out-of-stock', purchasable: false, quantity: 0, schemaAvailability: 'https://schema.org/OutOfStock' }],
  ['1', { kind: 'low-stock', purchasable: true, quantity: 1, schemaAvailability: 'https://schema.org/InStock' }],
  [10, { kind: 'low-stock', purchasable: true, quantity: 10, schemaAvailability: 'https://schema.org/InStock' }],
  ['11', { kind: 'in-stock', purchasable: true, quantity: 11, schemaAvailability: 'https://schema.org/InStock' }],
]) {
  assert.deepEqual(normalizeCatalogStock(input), expected, `TC-2 stock state ${String(input)}`);
}
for (const input of [undefined, null, '', 'unknown', '1.5', '1e2', '-1', -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '9007199254740992']) {
  assert.deepEqual(normalizeCatalogStock(input), { kind: 'unknown', purchasable: false }, `TC-2 unknown stock ${String(input)}`);
}
assert.equal(JSON.stringify(normalizeCatalogStock('unknown')).includes('BackOrder'), false, 'TC-2 unknown stock never fabricates BackOrder');

for (const value of [0, 1, 1050, 10099]) assert.equal(normalizeMinorPrice(value), value, `TC-3 finite nonnegative integer minor price ${value}`);
for (const value of [-1, 1.234, Number.MAX_VALUE, Number.NaN, Number.POSITIVE_INFINITY, undefined, null, '100']) {
  assert.equal(normalizeMinorPrice(value), undefined, `TC-3 invalid price ${String(value)}`);
}
assert.equal(normalizeCurrencyCode(' rub '), 'RUB', 'TC-3 valid currency is normalized');
assert.equal(normalizeCurrencyCode('RUBLE'), undefined, 'TC-3 invalid currency is omitted');
assert.equal(normalizeCurrencyCode('USD'), undefined, 'TC-3 unsupported non-RUB currency is omitted under the store currency contract');
assert.match(priceFormatter(1000), /10\s?₽/, 'TC-3 integer ruble price has no artificial decimals');
assert.match(priceFormatter(1050), /10,5/, 'TC-3 fractional ruble price remains visible');
assert.match(priceFormatter(10099), /100,99/, 'TC-3 two fractional ruble digits remain visible');

const hostile = {
  description: 'Ткань & дерево \u2028 снеговик ☃',
  name: '</script><script id="injected">alert(1)</script>',
};
const serialized = serializeJsonLd(hostile);
assert.doesNotMatch(serialized, /<|>|&|\u2028/, 'TC-4 unsafe script characters are escaped');
assert.deepEqual(JSON.parse(serialized), hostile, 'TC-4 escaped JSON-LD preserves Unicode and text values');
assert.equal(stripHtml('<p>Ткань &amp; дерево &#9731;&nbsp;&lt;ok&gt;</p>'), 'Ткань & дерево ☃ <ok>', 'TC-4 structured description matches decoded visible text');
assert.equal(stripHtml('&AMP; &#x2603;'), '& ☃', 'TC-4 named and hexadecimal entities decode case-insensitively');

console.log('TC-1..TC-4 catalog value and JSON-LD boundary checks passed');
