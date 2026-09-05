import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isIndexationAllowed, PRODUCTION_ORIGIN } from '../src/shared/lib/indexation-policy.ts';

assert.equal(isIndexationAllowed('true', PRODUCTION_ORIGIN), true, 'exact true and production origin must allow indexation');

for (const [flag, origin, label] of [
  ['false', PRODUCTION_ORIGIN, 'false flag'],
  [undefined, PRODUCTION_ORIGIN, 'missing flag'],
  ['1', PRODUCTION_ORIGIN, 'numeric flag'],
  ['TRUE', PRODUCTION_ORIGIN, 'wrong-case flag'],
  ['yes', PRODUCTION_ORIGIN, 'unknown flag'],
  ['true', 'https://test.domfabrik.ru', 'test origin'],
  ['true', 'https://unknown.domfabrik.ru', 'unknown origin'],
  ['true', 'https://domfabrik.ru/', 'non-exact production origin'],
  ['true', undefined, 'missing origin'],
]) {
  assert.equal(isIndexationAllowed(flag, origin), false, `${label} must deny indexation`);
}

const workflow = readFileSync(new URL('../.github/workflows/main.yml', import.meta.url), 'utf8');
assert.match(workflow, /indexation_allow="true"/, 'production workflow must select true');
assert.match(workflow, /indexation_allow="false"/, 'test workflow must select false');
assert.match(workflow, /STOREFRONT_ORIGIN=\$\{\{ steps\.vars\.outputs\.public_origin \}\}/, 'workflow must write the exact public origin');
assert.match(workflow, /INDEXATION_ALLOW=\$\{\{ steps\.vars\.outputs\.indexation_allow \}\}/, 'workflow must write the selected indexation flag');

console.log('Indexation policy matrix and CI wiring checks passed');
