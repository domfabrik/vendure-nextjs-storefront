/** Run the existing isolated lead UI harness and emit A14/A15 evidence. */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiUrl = process.env.LEAD_TEST_API_URL;
if (!apiUrl) throw new Error('LEAD_TEST_API_URL is required for isolated-write coverage');
const outputDir = resolve(process.env.LEAD_ACCEPTANCE_OUT_DIR ?? 'artifacts/storefront-acceptance');
mkdirSync(outputDir, { recursive: true });
const sourceSha =
  process.env.GITHUB_SHA ??
  (() => {
    try {
      return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown-local';
    }
  })();
const result = spawnSync(process.execPath, ['scripts/lead-checkout-ui-test.mjs'], {
  env: { ...process.env, LEAD_TEST_API_URL: apiUrl },
  encoding: 'utf8',
  shell: false,
});
const status = result.status === 0 ? 'PASS' : 'FAIL';
const reason =
  status === 'PASS'
    ? 'existing isolated UI harness proved happy receipt, lost-response replay, and independent next checkout'
    : `existing isolated UI harness exited ${result.status ?? 'without a status'}`;
const report = {
  profile: 'isolated-write',
  sourceSha,
  command: 'node scripts/lead-checkout-ui-test.mjs',
  apiHost: new URL(apiUrl).hostname,
  startedAt: new Date().toISOString(),
  extensions: {
    validation: {
      caseId: 'A09',
      status,
      harness: 'lead-checkout-ui-test.mjs',
      scenarios: ['invalid-input validation errors', 'close and reopen after validation', 'prepare-error disables submit'],
    },
  },
  cases: [
    { id: 'A14', title: 'isolated checkout happy path', status, reason, evidence: { harness: 'lead-checkout-ui-test.mjs' } },
    { id: 'A15', title: 'isolated checkout retry', status, reason, evidence: { harness: 'lead-checkout-ui-test.mjs' } },
  ],
};
report.finishedAt = new Date().toISOString();
report.summary = {
  PASS: report.cases.filter((testCase) => testCase.status === 'PASS').length,
  FAIL: report.cases.filter((testCase) => testCase.status === 'FAIL').length,
  NOT_RUN: 0,
};
writeFileSync(resolve(outputDir, 'isolated-report.json'), JSON.stringify(report, null, 2));
writeFileSync(
  resolve(outputDir, 'isolated-junit.xml'),
  `<testsuite name="isolated-lead" tests="2" failures="${report.summary.FAIL}"><properties><property name="sourceSha" value="${sourceSha}"/><property name="profile" value="isolated-write"/></properties>${report.cases.map((testCase) => `<testcase classname="${testCase.id}" name="${testCase.title}">${status === 'FAIL' ? `<failure message="${reason.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"/>` : ''}</testcase>`).join('')}</testsuite>`,
);
console.log(
  JSON.stringify(
    { profile: report.profile, summary: report.summary, report: resolve(outputDir, 'isolated-report.json'), junit: resolve(outputDir, 'isolated-junit.xml') },
    null,
    2,
  ),
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
