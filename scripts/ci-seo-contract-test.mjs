import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workflow = readFileSync('.github/workflows/main.yml', 'utf8');
const acceptanceWorkflow = readFileSync('.github/workflows/acceptance.yml', 'utf8');
const buildJob = workflow.match(/^ {2}build:[\s\S]*?(?=^ {2}deploy:)/m)?.[0];

assert.ok(buildJob, 'TC-CI build job must exist');
assert.doesNotMatch(buildJob, /--if-present|continue-on-error:\s*true/, 'TC-CI required checks must fail the job instead of being skipped');
assert.match(buildJob, /^\s*run: npm run lint$/m, 'TC-CI lint must be mandatory');
assert.match(buildJob, /^\s*run: npm test$/m, 'TC-CI unit and isolation tests must be mandatory');
assert.match(buildJob, /^\s*run: npm run test:seo$/m, 'TC-CI production SSR harness must be mandatory');
assert.match(acceptanceWorkflow, /name: Storefront acceptance \(no deploy\)/, 'TC-CI acceptance workflow must be separate from deployment');
assert.match(acceptanceWorkflow, /- codex\/seo-indexing-delivery/, 'TC-CI acceptance workflow must run on the exact feature branch');
assert.doesNotMatch(acceptanceWorkflow, /docker push|deploy-storefront|deploy-vendure|\/opt\/fabric/, 'TC-CI acceptance workflow must not deploy or touch server env');
assert.match(acceptanceWorkflow, /^\s*run: npm run test:acceptance$/m, 'TC-CI live production-safe acceptance must be mandatory');
assert.match(acceptanceWorkflow, /^\s*run: npm run test:lead-backend:report$/m, 'TC-CI isolated checkout acceptance must be mandatory');
assert.match(acceptanceWorkflow, /npm install --ignore-scripts --no-audit --no-fund/, 'TC-CI backend fixture install must tolerate platform optional lock entries');
assert.match(acceptanceWorkflow, /npm rebuild bcrypt/, 'TC-CI backend fixture must rebuild native bcrypt after scriptless install');
assert.match(acceptanceWorkflow, /require\('bcrypt'\)/, 'TC-CI backend fixture must verify bcrypt can load before startup');
assert.match(acceptanceWorkflow, /node scripts\/acceptance-aggregate\.mjs/, 'TC-CI must aggregate all A01-A18 profiles');
assert.match(acceptanceWorkflow, /0387240ad3ee088270ffd4582c3c66c73a30f5e6/, 'TC-CI must pin accepted backend fixture source');

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
