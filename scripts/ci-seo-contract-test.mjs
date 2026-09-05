import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workflow = readFileSync('.github/workflows/main.yml', 'utf8');
const buildJob = workflow.match(/^ {2}build:[\s\S]*?(?=^ {2}deploy:)/m)?.[0];

assert.ok(buildJob, 'TC-CI build job must exist');
assert.doesNotMatch(buildJob, /--if-present|continue-on-error:\s*true/, 'TC-CI required checks must fail the job instead of being skipped');
assert.match(buildJob, /^\s*run: npm run lint$/m, 'TC-CI lint must be mandatory');
assert.match(buildJob, /^\s*run: npm test$/m, 'TC-CI unit and isolation tests must be mandatory');
assert.match(buildJob, /^\s*run: npm run test:seo$/m, 'TC-CI production SSR harness must be mandatory');

const fixture = mkdtempSync(join(tmpdir(), 'fabric-ci-failure-'));
assert.equal(fixture.startsWith(join(tmpdir(), 'fabric-ci-failure-')), true, `unsafe CI fixture path: ${fixture}`);
try {
  const failureScript = join(fixture, 'fail.mjs');
  const markerScript = join(fixture, 'marker.mjs');
  const marker = join(fixture, 'must-not-run');
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, scripts: { test: 'node fail.mjs && node marker.mjs' } }));
  writeFileSync(failureScript, 'process.exit(23);\n');
  writeFileSync(markerScript, `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'ran');\n`);
  assert.ok(process.env.npm_execpath, 'TC-CI npm_execpath must be available under npm test');
  const failedStep = spawnSync(process.execPath, [process.env.npm_execpath, 'test'], { cwd: fixture, encoding: 'utf8', shell: false });
  assert.equal(failedStep.error, undefined, `TC-CI failure fixture could not run: ${failedStep.error}`);
  assert.equal(failedStep.status, 23, 'TC-CI a failing mandatory npm script must propagate its nonzero process status');
  assert.equal(existsSync(marker), false, 'TC-CI a step after the failing script must not run');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('TC-CI mandatory workflow checks and isolated failure propagation passed');
