import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createTheme, ThemeProvider } from '@mui/material';
import { parse } from 'graphql';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as catalogValues from '../src/shared/lib/catalog-values.ts';
import { priceFormatter } from '../src/shared/lib/price-formatter.ts';
import { stripHtml } from '../src/shared/lib/strip-html.ts';

const require = createRequire(import.meta.url);
const sharedLib = { ...catalogValues, priceFormatter, stripHtml, GA4_CONSENT_CHANGE_EVENT: 'consent-change', trackGa4ViewItem: (event) => viewEvents.push(event) };
const viewEvents = [];
const cartAdds = [];
const state = [];
let hookIndex = 0;
const cache = new Map();
const theme = createTheme({ palette: { border: { main: '#ddd' }, accent: { main: '#333', dark: '#111', light: '#eee' } } });

// Execute the real TSX components. Only external cart/analytics effects and the unrelated gallery are isolated.
function loadSource(path) {
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(path, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === '@/shared/lib') return sharedLib;
    if (specifier === '@/shared/router') return { contacts: { phoneHref: 'tel:123', phone: '123' } };
    if (specifier === '@/shared/store' || specifier === '@/shared/store/cart')
      return { useCartStore: (selector) => selector({ items: [], addToCart: (item) => cartAdds.push(item), setItemQuantity: () => {} }) };
    if (specifier === '@routes') return { routes: { product: (slug) => `/products/${slug}` } };
    if (specifier === 'next/link') return { __esModule: true, default: ({ children, ...props }) => createElement('a', props, children) };
    if (specifier === 'react') {
      return {
        ...require('react'),
        useEffect: (effect) => effect(),
        useState: (initial) => {
          const index = hookIndex++;
          if (!(index in state)) state[index] = initial;
          return [
            state[index],
            (value) => {
              state[index] = typeof value === 'function' ? value(state[index]) : value;
            },
          ];
        },
      };
    }
    if (specifier === './product-gallery') return { ProductGallery: ({ discountPercent }) => createElement('div', { 'data-gallery-discount': discountPercent }) };
    if (specifier.startsWith('.')) {
      const target = resolve(dirname(path), specifier);
      return loadSource(`${target}${specifier.endsWith('characteristics') ? '.ts' : '.tsx'}`);
    }
    return require(specifier);
  };
  runInNewContext(
    outputText,
    { module, exports: module.exports, require: localRequire, window: { addEventListener: () => {}, removeEventListener: () => {} } },
    { filename: path },
  );
  cache.set(path, module.exports);
  return module.exports;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const { ProductDetails } = loadSource(resolve(root, 'src/entities/product/ui/product-details/index.tsx'));
const { VariantSelector } = loadSource(resolve(root, 'src/entities/product/ui/product-details/variant-selector.tsx'));
const { PriceBlock } = loadSource(resolve(root, 'src/entities/product/ui/product-details/price-block.tsx'));
const { buildProductJsonLd } = loadSource(resolve(root, 'src/entities/product/lib/product-jsonld.ts'));
const { ProductCard } = loadSource(resolve(root, 'src/shared/ui/product-card/index.tsx'));
const { buildCollectionItemListJsonLd } = loadSource(resolve(root, 'src/entities/collection/lib/collection-jsonld.ts'));

function markup(tree) {
  return renderToStaticMarkup(createElement(ThemeProvider, { theme }, tree));
}

function findElement(element, type) {
  if (!element || typeof element !== 'object') return undefined;
  if (element.type === type) return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return undefined;
}

const variant = {
  id: 'missing',
  name: 'Без цены',
  sku: 'TEST-MISSING',
  currencyCode: 'RUB',
  priceWithTax: 12000,
  basePriceWithTax: 15000,
  stockLevel: 'IN_STOCK',
  options: [{ id: 'missing', groupId: 'finish', code: 'missing', name: 'Без цены' }],
  assets: [],
  featuredAsset: null,
  customFields: { priceNotSpecified: true, discountPercent: 20, oldPrice: 15000 },
};
const pricedVariant = {
  ...variant,
  id: 'priced',
  name: 'С ценой',
  customFields: { ...variant.customFields, priceNotSpecified: false },
  options: [{ id: 'priced', groupId: 'finish', code: 'priced', name: 'С ценой' }],
};
const product = {
  id: 'product',
  name: 'Тестовый товар',
  slug: 'mixed-price',
  description: '',
  assets: [],
  featuredAsset: null,
  collections: [],
  customFields: {},
  optionGroups: [
    {
      id: 'finish',
      code: 'finish',
      name: 'Отделка',
      options: [
        { id: 'missing', name: 'Без цены' },
        { id: 'priced', name: 'С ценой' },
      ],
    },
  ],
  variants: [variant, pricedVariant],
};

function render(currentProduct = product) {
  hookIndex = 0;
  const tree = ProductDetails({ product: currentProduct, initialVariantId: currentProduct.variants[0].id });
  return { tree, html: markup(tree) };
}

function assertMissing(html) {
  assert.match(html, /Цена не указана/);
  assert.doesNotMatch(
    html,
    /Цена уточняется|В наличии|Осталось мало товара|Нет в наличии|Наличие уточняется|data-testid="add-to-cart"|В корзине|Экономия|data-gallery-discount="20"|-20%/,
  );
  assert.doesNotMatch(html, /120\s*₽|150\s*₽/);
}

for (const stockLevel of ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNKNOWN']) {
  for (const priceWithTax of [0, 12000]) {
    state.length = 0;
    const missingProduct = { ...product, variants: [{ ...variant, stockLevel, priceWithTax }] };
    assertMissing(render(missingProduct).html);
    assert.equal(buildProductJsonLd(missingProduct, 'https://test.example').offers, undefined, 'flagged variant cannot emit Offer even with a stale positive price');
  }
}
assert.equal(viewEvents.length, 0, 'flagged variant emits no GA4 view_item');

state.length = 0;
let current = render();
assertMissing(current.html);
findElement(current.tree, VariantSelector).props.onSelect('finish', 'priced');
current = render();
assert.match(current.html, /120\s*₽/);
assert.match(current.html, /150\s*₽/);
assert.match(current.html, /-20%|Экономия/);
assert.match(current.html, /В наличии/);
assert.match(current.html, /data-testid="add-to-cart"/);
assert.equal(viewEvents.at(-1).unitPriceMinor, 12000);
findElement(current.tree, PriceBlock).props.onAdd();
assert.equal(cartAdds.at(-1).productVariantId, 'priced');
assert.equal(cartAdds.at(-1).price, 12000);
const eventCount = viewEvents.length;
findElement(current.tree, VariantSelector).props.onSelect('finish', 'missing');
assertMissing(render().html);
assert.equal(viewEvents.length, eventCount, 'switching back emits no zero/stale-price view_item');

for (const priceNotSpecified of [false, null, undefined]) {
  state.length = 0;
  const normalProduct = { ...product, variants: [{ ...pricedVariant, customFields: { ...pricedVariant.customFields, priceNotSpecified } }] };
  assert.match(render(normalProduct).html, /120\s*₽/);
  assert.equal(buildProductJsonLd(normalProduct, 'https://test.example').offers.lowPrice, 120, 'legacy false/null/absent flags preserve priced offers');
}
assert.equal(buildProductJsonLd(product, 'https://test.example').offers.offerCount, 1, 'mixed product keeps only the priced Offer');

const tile = {
  productName: 'Без цены',
  slug: 'missing-price',
  chosenOffer: null,
  productAsset: null,
  currencyCode: 'RUB',
  priceWithTax: { __typename: 'SinglePrice', value: 0 },
};
const tileHtml = markup(ProductCard({ product: tile }));
assert.match(tileHtml, /Цена уточняется/);
assert.doesNotMatch(tileHtml, /В корзину|В корзине/);
assert.equal(buildCollectionItemListJsonLd([tile], 'https://test.example').itemListElement[0].item, undefined, 'zero-price catalog item has no Offer');
const mixedTile = {
  ...tile,
  chosenOffer: { productVariantId: 'priced', currencyCode: 'RUB', priceWithTax: 12000, basePriceWithTax: 15000, discountPercent: 20, productAsset: null },
};
assert.match(markup(ProductCard({ product: mixedTile })), /120\s*₽/);
assert.match(markup(ProductCard({ product: mixedTile })), /В корзину/);

const querySource = readFileSync(new URL('../src/shared/api/products/queries.ts', import.meta.url), 'utf8');
const document = parse([...querySource.matchAll(/gql`([\s\S]*?)`/g)][0][1]);
let fields = document.definitions[0].selectionSet.selections;
for (const field of ['product', 'variants', 'customFields', 'priceNotSpecified']) {
  const found = fields.find((selection) => selection.kind === 'Field' && selection.name.value === field);
  assert.ok(found, `PDP query selects ${field}`);
  fields = found.selectionSet?.selections ?? [];
}
const pageSource = readFileSync(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');
assert.match(
  pageSource,
  /initialVariant\?\.customFields\.priceNotSpecified !== true && initialPrice !== undefined[\s\S]*?<ProductDetailEvent/,
  'flagged PDP cannot emit Metrika product-detail analytics',
);
console.log('PDP missing-price render, variant switching, cart, analytics, query and JSON-LD checks passed');
