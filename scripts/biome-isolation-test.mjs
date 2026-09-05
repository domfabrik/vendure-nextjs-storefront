import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspace = resolve('.');
const content = 'const sentinel={mustStayUnformatted:true}\n';
const biome = resolve('node_modules/@biomejs/biome/bin/biome');

function runIsolationProbe(directory) {
  assert.equal(directory.startsWith(`${workspace}${process.platform === 'win32' ? '\\' : '/'}.next-seo-http-isolation-`), true, `unsafe isolation path: ${directory}`);
  const sentinel = resolve(directory, 'must-not-be-formatted.js');
  let owned = false;
  try {
    mkdirSync(directory);
    owned = true;
    writeFileSync(sentinel, content);
    for (const command of ['check', 'format']) {
      const result = spawnSync(process.execPath, [biome, command, '--write', '--no-errors-on-unmatched', directory], { encoding: 'utf8' });
      assert.equal(result.status, 0, `${command} failed: ${result.stderr || result.stdout}`);
      assert.equal(readFileSync(sentinel, 'utf8'), content, `${command} rewrote a generated build sentinel`);
    }
  } finally {
    if (owned) {
      rmSync(sentinel, { force: true });
      rmSync(directory, { recursive: true, force: true });
    }
  }
}

runIsolationProbe(resolve(`.next-seo-http-isolation-${process.pid}`));

const collisionDirectory = resolve(`.next-seo-http-isolation-${process.pid}-collision`);
const foreignMarker = resolve(collisionDirectory, 'foreign-marker');
mkdirSync(collisionDirectory);
try {
  writeFileSync(foreignMarker, 'foreign');
  assert.throws(() => runIsolationProbe(collisionDirectory), { code: 'EEXIST' });
  assert.equal(existsSync(foreignMarker), true, 'collision cleanup removed a directory owned by another process');
  assert.equal(readFileSync(foreignMarker, 'utf8'), 'foreign', 'collision cleanup changed a foreign marker');
} finally {
  rmSync(foreignMarker, { force: true });
  rmSync(collisionDirectory, { recursive: true, force: true });
}

console.log('TC-ISOLATION Biome exclusion and ownership-safe collision cleanup passed');
