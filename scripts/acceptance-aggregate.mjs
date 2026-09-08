/** Combine production-safe, isolated-write, and negative-contract evidence into A01-A18. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outputDir = resolve(process.env.ACCEPTANCE_OUT_DIR ?? 'artifacts/storefront-acceptance');
const livePath = resolve(process.env.ACCEPTANCE_LIVE_REPORT ?? `${outputDir}/report.json`);
const isolatedPath = resolve(process.env.ACCEPTANCE_ISOLATED_REPORT ?? `${outputDir}/isolated-report.json`);
const live = JSON.parse(readFileSync(livePath, 'utf8'));
const isolated = JSON.parse(readFileSync(isolatedPath, 'utf8'));
const negative = spawnSync(process.execPath, ['scripts/acceptance-contract-test.mjs'], { encoding: 'utf8', shell: false });
const expected = [...Array(18)].map((_, index) => `A${String(index + 1).padStart(2, '0')}`);
function assertReportIds(report, expectedIds, label) {
  const ids = report.cases.map((testCase) => testCase.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate case IDs`);
  if (ids.some((id) => !expectedIds.includes(id)) || ids.length !== expectedIds.length || expectedIds.some((id) => !ids.includes(id)))
    throw new Error(`${label} must contain exactly ${expectedIds.join(', ')}`);
}
assertReportIds(live, expected, 'live report');
assertReportIds(isolated, ['A14', 'A15'], 'isolated report');
if (!live.sourceSha || !isolated.sourceSha || live.sourceSha !== isolated.sourceSha) throw new Error('live and isolated reports must carry the same source SHA');
if (live.commandProfile !== 'production-safe') throw new Error('live report must use the production-safe profile');
if (isolated.profile !== 'isolated-write') throw new Error('isolated report must use the isolated-write profile');
const validation = isolated.extensions?.validation;
const expectedValidationScenarios = ['invalid-input validation errors', 'close and reopen after validation', 'prepare-error disables submit'];
if (
  validation?.caseId !== 'A09' ||
  validation.status !== 'PASS' ||
  validation.harness !== 'lead-checkout-ui-test.mjs' ||
  JSON.stringify(validation.scenarios) !== JSON.stringify(expectedValidationScenarios)
)
  throw new Error('isolated report must provide the explicit A09 validation extension');
const cases = new Map(live.cases.map((testCase) => [testCase.id, { ...testCase }]));
for (const testCase of isolated.cases) cases.set(testCase.id, { ...testCase });
cases.set('A09', { ...cases.get('A09'), evidence: { ...cases.get('A09').evidence, isolatedValidation: validation } });
cases.set('A17', {
  id: 'A17',
  title: 'negative harness',
  status: negative.status === 0 ? 'PASS' : 'FAIL',
  reason: negative.status === 0 ? 'behavioral origin/counter/canonical/API failure probes passed' : `acceptance contract exited ${negative.status ?? 'without a status'}`,
  evidence: { harness: 'acceptance-contract-test.mjs' },
});
const report = {
  profile: 'combined',
  sourceSha: live.sourceSha ?? isolated.sourceSha ?? 'unknown-local',
  command: 'node scripts/acceptance-aggregate.mjs',
  startedAt: new Date().toISOString(),
  cases: expected.map((id) => cases.get(id) ?? { id, title: 'missing case', status: 'NOT_RUN', reason: 'case missing from input report', evidence: {} }),
};
report.finishedAt = new Date().toISOString();
report.summary = Object.fromEntries(['PASS', 'FAIL', 'NOT_RUN'].map((status) => [status, report.cases.filter((testCase) => testCase.status === status).length]));
report.overall = report.summary.FAIL === 0 && report.summary.NOT_RUN === 0 ? 'PASS' : 'FAIL';
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'aggregate-report.json'), JSON.stringify(report, null, 2));
const xml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
writeFileSync(
  resolve(outputDir, 'aggregate-junit.xml'),
  `<testsuite name="storefront-acceptance-combined" tests="18" failures="${report.summary.FAIL + report.summary.NOT_RUN}" skipped="${report.summary.NOT_RUN}"><properties><property name="sourceSha" value="${xml(report.sourceSha)}"/><property name="profile" value="combined"/></properties>${report.cases.map((testCase) => `<testcase classname="${testCase.id}" name="${xml(testCase.title)}">${testCase.status === 'PASS' ? '' : `<failure message="${xml(testCase.reason)}"/>`}</testcase>`).join('')}</testsuite>`,
);
console.log(
  JSON.stringify(
    { overall: report.overall, summary: report.summary, report: resolve(outputDir, 'aggregate-report.json'), junit: resolve(outputDir, 'aggregate-junit.xml') },
    null,
    2,
  ),
);
if (negative.stdout) process.stdout.write(negative.stdout);
if (negative.stderr) process.stderr.write(negative.stderr);
process.exitCode = report.overall === 'PASS' ? 0 : 1;
