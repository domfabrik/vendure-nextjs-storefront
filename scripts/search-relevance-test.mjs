import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSerializer } from 'nuqs/server';
import { resolveSearchSort, searchParsers } from '../src/app/search/search-params.ts';

const serializeSearch = createSerializer(searchParsers);
const implicitSearch = new URLSearchParams(serializeSearch({ q: 'диван' }));
const explicitNameAscSearch = new URLSearchParams(serializeSearch({ q: 'диван', sort: 'name-ASC' }));
assert.equal(implicitSearch.get('sort'), null, 'TC1 implicit search omits sort');
assert.equal(explicitNameAscSearch.get('sort'), 'name-ASC', 'TC2 explicit name-ASC survives URL serialization');
assert.equal(resolveSearchSort('диван', 'name-ASC', implicitSearch.has('sort')), undefined, 'TC1 serialized implicit search uses relevance');
assert.deepEqual(resolveSearchSort('диван', 'name-ASC', explicitNameAscSearch.has('sort')), { name: 'ASC' }, 'TC2 serialized explicit name-ASC keeps alphabetical ordering');

assert.equal(resolveSearchSort('диван', 'name-ASC', false), undefined, 'TC1 nonempty term without sort uses relevance');
assert.equal(resolveSearchSort('  диван  ', 'name-ASC', false), undefined, 'TC1 whitespace around term does not restore implicit sort');

for (const sortKey of ['name-ASC', 'name-DESC', 'price-ASC', 'price-DESC']) {
  assert.deepEqual(
    resolveSearchSort('диван', sortKey, true),
    {
      [sortKey.startsWith('price') ? 'price' : 'name']: sortKey.endsWith('ASC') ? 'ASC' : 'DESC',
    },
    `TC2 explicit ${sortKey} is preserved`,
  );
}

assert.deepEqual(resolveSearchSort('', 'name-ASC', false), { name: 'ASC' }, 'TC2 empty term keeps catalog default sort');
assert.deepEqual(resolveSearchSort('   ', 'name-ASC', false), { name: 'ASC' }, 'TC2 whitespace-only term keeps catalog default sort');
assert.deepEqual(resolveSearchSort('', 'relevance', true), { name: 'ASC' }, 'TC2 empty term keeps catalog default even with relevance key');
assert.equal(resolveSearchSort('диван', 'relevance', true), undefined, 'TC2 explicit relevance keeps API sort omitted');
assert.deepEqual(resolveSearchSort('диван', 'unknown', true), { name: 'ASC' }, 'TC2 invalid explicit sort keeps safe default');

const pageSource = readFileSync(new URL('../src/app/search/page.tsx', import.meta.url), 'utf8');
assert.match(pageSource, /resolveSearchSort\(term, sortKey, searchParams\.sort !== undefined\)/, 'TC1 page uses the tested sort resolver');
assert.match(pageSource, /defaultSortIsRelevance=\{term\.length > 0 && searchParams\.sort === undefined\}/, 'TC2 page exposes implicit relevance to the control');
assert.match(pageSource, /take: PER_PAGE/, 'TC2 search page keeps the first-page size');
assert.match(pageSource, /skip: \(page - 1\) \* PER_PAGE/, 'TC2 search page keeps the requested page offset');
assert.match(pageSource, /\.\.\.baseQuery, take: 0, skip: 0/, 'TC2 facet count query keeps its zero-offset contract');

console.log('Search relevance sort resolution checks passed');
