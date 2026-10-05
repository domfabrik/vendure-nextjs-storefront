import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CATALOG_OPERATIONS, CATALOG_STAGES, createCatalogLogEmitter } from '../src/shared/api/catalog-observability-core.ts';

const canaries = ['canary@example.test', 'Bearer canary-token', "SELECT * FROM customer WHERE email='canary@example.test'", 'cookie=canary-token'];
const lines = [];
let now = 0;
const emit = createCatalogLogEmitter({
  enabled: true,
  slowMs: 100,
  maxEventsPerMinute: 5,
  now: () => now,
  write: (line) => lines.push(line),
});

for (let index = 0; index < CATALOG_STAGES.length; index += 1) {
  const error = Object.assign(new Error(canaries[index]), {
    name: index === 0 ? 'TimeoutError' : 'Error',
    response: index === 1 ? { status: 503, payload: canaries } : undefined,
    stack: canaries.join('\n'),
  });
  assert.equal(
    emit({
      requestID: randomUUID(),
      stage: CATALOG_STAGES[index],
      operation: CATALOG_OPERATIONS[index % CATALOG_OPERATIONS.length],
      outcome: 'failure',
      durationMs: 250 + index,
      error,
    }),
    true,
  );
}

assert.equal(emit({ requestID: randomUUID(), stage: 'product', operation: 'GetProductBySlug', outcome: 'success', durationMs: 99 }), false, 'fast success stays silent');
assert.equal(emit({ requestID: randomUUID(), stage: 'product', operation: 'GetProductBySlug', outcome: 'success', durationMs: 100 }), true, 'slow success is emitted');
assert.equal(
  emit({ requestID: randomUUID(), stage: 'product', operation: 'GetProductBySlug', outcome: 'failure', durationMs: 100, error: new Error(canaries[0]) }),
  false,
  'minute cap suppresses the sixth event',
);

assert.equal(lines.length, 5);
for (const line of lines) {
  assert.match(line, /^\[catalog-observability\] /);
  assert.ok(Buffer.byteLength(line) < 512);
  for (const canary of canaries) assert.doesNotMatch(line, new RegExp(canary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  const record = JSON.parse(line.slice(line.indexOf('{')));
  assert.deepEqual(
    Object.keys(record).sort(),
    record.outcome === 'failure'
      ? ['durationMs', 'errorClass', 'event', 'operation', 'outcome', 'requestID', 'schemaVersion', 'stage']
      : ['durationMs', 'event', 'operation', 'outcome', 'requestID', 'schemaVersion', 'stage'],
  );
}

now = 60_000;
assert.equal(
  emit({ requestID: randomUUID(), stage: 'header', operation: 'GetAllCollections', outcome: 'failure', durationMs: 1, error: new Error('reset') }),
  true,
  'new minute resets the cap',
);

console.log('TC-O1/O2/O4 storefront stage failures, secret canaries, slow-only output, byte size, and rate cap passed');
