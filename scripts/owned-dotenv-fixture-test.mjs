import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ownedProductionDotenvFixture } from './owned-dotenv-fixture.mjs';

const root = mkdtempSync(join(tmpdir(), 'seo-owned-dotenv-'));
const target = join(root, '.env.production');
const synthetic = 'SEO_HTTP_STANDALONE_MARKER=synthetic-fixture\n';
const sentinel = Buffer.from('LOCAL_SENTINEL_SECRET=must-be-restored-byte-for-byte\r\n');

try {
  const absentFixture = ownedProductionDotenvFixture(root, synthetic);
  try {
    absentFixture.install();
    assert.equal(readFileSync(target, 'utf8'), synthetic);
    throw new Error('injected harness failure');
  } catch (error) {
    assert.equal(error.message, 'injected harness failure');
  } finally {
    absentFixture.restore();
  }
  assert.equal(existsSync(target), false, 'an initially absent dotenv must stay absent after failure');
  assert.deepEqual(readdirSync(root), [], 'failure cleanup must not leave a backup');

  writeFileSync(target, sentinel);
  chmodSync(target, 0o640);
  const originalMode = statSync(target).mode;
  const existingFixture = ownedProductionDotenvFixture(root, synthetic);
  existingFixture.install();
  assert.equal(readFileSync(target, 'utf8'), synthetic);
  existingFixture.restore();
  assert.deepEqual(readFileSync(target), sentinel, 'preexisting dotenv bytes must be restored exactly');
  assert.equal(statSync(target).mode, originalMode, 'preexisting dotenv mode must be restored exactly');
  assert.deepEqual(readdirSync(root), ['.env.production'], 'success cleanup must not leave a backup');
  console.log('Owned dotenv fixture absent/failure/preexisting restoration checks passed');
} finally {
  rmSync(root, { recursive: true, force: true });
}
