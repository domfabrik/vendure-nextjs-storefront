import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'graphql';

function documents(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  return [...source.matchAll(/gql`([\s\S]*?)`/g)].map((match) => parse(match[1]));
}

function operation(document, name) {
  return document.definitions.find((definition) => definition.kind === 'OperationDefinition' && definition.name?.value === name);
}

function hasFieldPath(definition, path) {
  let selections = definition?.selectionSet.selections ?? [];
  for (const fieldName of path) {
    const field = selections.find((selection) => selection.kind === 'Field' && selection.name.value === fieldName);
    if (!field) return false;
    selections = field.selectionSet?.selections ?? [];
  }
  return true;
}

const products = documents('../src/shared/api/products/queries.ts');
const search = documents('../src/shared/api/search/queries.ts');
const collections = documents('../src/shared/api/collections/queries.ts');

for (const [allDocuments, operationName, fieldPath] of [
  [products, 'GetProductBySlug', ['product', 'variants', 'customFields', 'priceNotSpecified']],
  [products, 'GetFeaturedProducts', ['search', 'items', 'priceNotSpecified']],
  [products, 'GetProductSliders', ['collection', 'productVariants', 'items', 'customFields', 'priceNotSpecified']],
  [search, 'SearchProducts', ['search', 'items', 'priceNotSpecified']],
  [collections, 'SearchCollectionProducts', ['search', 'items', 'priceNotSpecified']],
  [collections, 'GetCollectionProductVariants', ['collection', 'productVariants', 'items', 'customFields', 'priceNotSpecified']],
]) {
  const definition = allDocuments.map((document) => operation(document, operationName)).find(Boolean);
  assert.ok(definition, `${operationName} operation exists`);
  assert.equal(hasFieldPath(definition, fieldPath), true, `${operationName} selects ${fieldPath.join('.')}`);
}

const productPage = readFileSync(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');
assert.match(productPage, /initialPriceState\.kind === 'priced'[\s\S]*?<ProductDetailEvent/, 'missing-price PDP cannot emit the zero-price ProductDetailEvent');

console.log('Missing-price GraphQL and product-detail analytics contracts passed');
