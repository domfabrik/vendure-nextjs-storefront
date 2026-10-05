import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const EXPECTED_CONCURRENCY = 4;
const EXPECTED_REQUEST_TIMEOUT_MS = 2_000;
const EXPECTED_BATCH_BUDGET_MS = 5_000;
const EXPECTED_BUDGET_STARTS = 12;
const sourcePath = resolve('src/shared/api/collections/ssr-budget.ts');
const source = readFileSync(sourcePath, 'utf8');
const sourceSha256 = createHash('sha256').update(source).digest('hex');
const ownedTempDir = mkdtempSync(join(tmpdir(), 'domfabrik-ssr-budget-'));
const allEvents = [];

function replaceLoggerImports(moduleSource) {
  const observabilityImport = "import { reportObservedCatalogFailure } from '../catalog-observability';";
  const coreImport = "import { classifyCatalogError, wasCatalogErrorObserved } from '../catalog-observability-core';";
  assert.equal(moduleSource.split(observabilityImport).length - 1, 1, 'source binding: expected one observability import');
  assert.equal(moduleSource.split(coreImport).length - 1, 1, 'source binding: expected one observability-core import');
  const isolatedSource = moduleSource
    .replace(observabilityImport, 'const reportObservedCatalogFailure = () => true;')
    .replace(coreImport, 'const classifyCatalogError = (error: unknown) => error instanceof Error ? error.name : typeof error; const wasCatalogErrorObserved = () => false;');
  assert.doesNotMatch(isolatedSource, /^import /m, 'source binding: only the two controlled logger imports may exist');
  return isolatedSource;
}

async function compileActualLoader(moduleSource, label) {
  const isolatedSource = replaceLoggerImports(moduleSource);
  const compiled = ts.transpileModule(isolatedSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: 'ssr-budget.ts',
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.deepEqual(errors, [], `source binding: TypeScript transpilation failed for ${label}`);
  const outputPath = join(ownedTempDir, `ssr-budget-${label}.mjs`);
  writeFileSync(outputPath, compiled.outputText, { encoding: 'utf8', flag: 'wx' });
  return import(`${pathToFileURL(outputPath).href}?source=${createHash('sha256').update(moduleSource).digest('hex')}`);
}

function recordEvent(startedAt, scenario, event, fields = {}) {
  allEvents.push({
    tMs: Math.round((performance.now() - startedAt) * 10) / 10,
    scenario,
    event,
    ...fields,
  });
}

async function waitFor(predicate, timeoutMs, label) {
  const deadline = performance.now() + timeoutMs;
  while (!predicate() && performance.now() < deadline) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
  }
  assert.equal(predicate(), true, label);
}

async function exerciseCancellation(loaderModule, scenario, responseMode) {
  const startedAt = performance.now();
  let logicalActive = 0;
  let logicalPeak = 0;
  let serverOpen = 0;
  let serverPeak = 0;
  let pendingClose = 0;
  const clientStarts = [];
  const clientAborts = [];
  const clientRejects = [];
  const serverStarts = [];
  const serverAborts = [];
  const serverCloses = [];
  const serverFinishes = [];
  const abortToCloseMs = [];

  const server = createServer((request, response) => {
    const requestID = String(request.headers['x-request-id']);
    const index = Number(request.headers['x-request-index']);
    const state = { abortedAt: undefined, closed: false };
    serverOpen += 1;
    serverPeak = Math.max(serverPeak, serverOpen);
    serverStarts.push({ requestID, index, timeMs: performance.now() - startedAt });
    recordEvent(startedAt, scenario, 'server-start', { requestID, index, logicalActive, serverOpen });
    request.once('aborted', () => {
      state.abortedAt = performance.now();
      pendingClose += 1;
      serverAborts.push(requestID);
      recordEvent(startedAt, scenario, 'server-abort', { requestID, index, logicalActive, serverOpen, pendingClose });
    });
    response.once('finish', () => {
      serverFinishes.push(requestID);
      recordEvent(startedAt, scenario, 'server-finish', { requestID, index, logicalActive, serverOpen, pendingClose });
    });
    response.once('close', () => {
      if (!state.closed) {
        state.closed = true;
        serverOpen -= 1;
      }
      if (state.abortedAt !== undefined) {
        pendingClose -= 1;
        abortToCloseMs.push(Math.round((performance.now() - state.abortedAt) * 10) / 10);
      }
      serverCloses.push(requestID);
      recordEvent(startedAt, scenario, 'server-close', { requestID, index, logicalActive, serverOpen, pendingClose });
    });
    if (responseMode === 'body-hang') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"data":');
    }
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  async function load(index, signal) {
    const requestID = `${scenario}-${index}-${randomUUID()}`;
    logicalActive += 1;
    logicalPeak = Math.max(logicalPeak, logicalActive);
    clientStarts.push({ requestID, index, timeMs: performance.now() - startedAt });
    recordEvent(startedAt, scenario, 'client-start', { requestID, index, logicalActive, serverOpen, pendingClose });
    signal.addEventListener(
      'abort',
      () => {
        clientAborts.push(requestID);
        recordEvent(startedAt, scenario, 'client-abort', { requestID, index, logicalActive, serverOpen, pendingClose, reason: signal.reason?.name });
      },
      { once: true },
    );
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/shop-api`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': requestID,
          'x-request-index': String(index),
        },
        body: '{}',
        signal,
      });
      return await response.text();
    } catch (error) {
      clientRejects.push(requestID);
      recordEvent(startedAt, scenario, 'client-reject', { requestID, index, logicalActive, serverOpen, pendingClose, errorClass: error?.name });
      throw error;
    } finally {
      logicalActive -= 1;
      recordEvent(startedAt, scenario, 'client-settled', { requestID, index, logicalActive, serverOpen, pendingClose });
    }
  }

  let results;
  let loaderDurationMs;
  let boundedTimer;
  try {
    const loaderStartedAt = performance.now();
    const loaderPromise = loaderModule.loadSecondaryCollections(
      Array.from({ length: 41 }, (_, index) => index),
      load,
    );
    const boundedFailure = new Promise((_, rejectPromise) => {
      boundedTimer = setTimeout(() => {
        server.closeAllConnections();
        rejectPromise(new Error(`${scenario}: loader exceeded the 8s test deadline`));
      }, 8_000);
    });
    results = await Promise.race([loaderPromise, boundedFailure]);
    loaderDurationMs = Math.round(performance.now() - loaderStartedAt);
    recordEvent(startedAt, scenario, 'loader-return', { logicalActive, logicalPeak, serverOpen, serverPeak, pendingClose, loaderDurationMs });
    await waitFor(() => serverOpen === 0 && pendingClose === 0, 1_000, `${scenario}: server cancellation did not drain within 1s`);
  } finally {
    clearTimeout(boundedTimer);
    server.closeAllConnections();
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }

  return {
    scenario,
    responseMode,
    logicalActive,
    logicalPeak,
    serverOpen,
    serverPeak,
    pendingClose,
    clientStarts,
    clientAborts,
    clientRejects,
    serverStarts,
    serverAborts,
    serverCloses,
    serverFinishes,
    abortToCloseMs,
    loaderDurationMs,
    results,
  };
}

function assertLogicalAndCancellationContract(metrics) {
  assert.ok(metrics.logicalPeak <= EXPECTED_CONCURRENCY, `${metrics.scenario}: logical client peak ${metrics.logicalPeak} exceeds ${EXPECTED_CONCURRENCY}`);
  assert.equal(metrics.logicalActive, 0, `${metrics.scenario}: all logical client operations settle`);
  assert.equal(metrics.results.length, 41, `${metrics.scenario}: result slots preserve all categories`);
  assert.equal(
    metrics.results.every((value) => value === null),
    true,
    `${metrics.scenario}: timed-out categories do not invent products`,
  );
  assert.equal(metrics.clientStarts.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: exactly three four-request waves start`);
  assert.equal(new Set(metrics.clientStarts.map(({ index }) => index)).size, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: no request retry`);
  assert.equal(metrics.clientAborts.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: every started logical request receives cancellation`);
  assert.equal(metrics.clientRejects.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: every started fetch/body promise rejects`);
  assert.equal(metrics.serverStarts.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: every logical start reaches real loopback HTTP`);
  assert.equal(metrics.serverAborts.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: server observes every HTTP abort`);
  assert.equal(metrics.serverCloses.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: server observes every response close`);
  assert.equal(metrics.serverFinishes.length, 0, `${metrics.scenario}: cancellation fixture never finishes a response`);
  assert.equal(metrics.serverOpen, 0, `${metrics.scenario}: no server response remains open after bounded drain`);
  assert.equal(metrics.pendingClose, 0, `${metrics.scenario}: no abort remains pending response.close after bounded drain`);
  assert.equal(metrics.abortToCloseMs.length, EXPECTED_BUDGET_STARTS, `${metrics.scenario}: every abort has an honest abort-to-close duration`);
  assert.ok(
    metrics.abortToCloseMs.every((durationMs) => durationMs >= 0),
    `${metrics.scenario}: abort-to-close durations are non-negative`,
  );
  assert.ok(metrics.loaderDurationMs >= 4_900 && metrics.loaderDurationMs <= 6_000, `${metrics.scenario}: five-second batch duration was ${metrics.loaderDurationMs}ms`);
  const firstStart = metrics.clientStarts[0].timeMs;
  assert.ok(
    metrics.clientStarts.every(({ timeMs }) => timeMs - firstStart < EXPECTED_BATCH_BUDGET_MS),
    `${metrics.scenario}: no request starts after the batch deadline`,
  );
  assert.ok(metrics.clientStarts[4].timeMs - firstStart >= EXPECTED_REQUEST_TIMEOUT_MS - 100, `${metrics.scenario}: second wave starts only after the per-request timeout`);
  assert.ok(metrics.clientStarts[8].timeMs - firstStart >= EXPECTED_REQUEST_TIMEOUT_MS * 2 - 100, `${metrics.scenario}: third wave starts only after two per-request timeouts`);
}

function publicSummary(metrics) {
  return {
    scenario: metrics.scenario,
    responseMode: metrics.responseMode,
    logicalPeak: metrics.logicalPeak,
    serverPeak: metrics.serverPeak,
    starts: metrics.clientStarts.length,
    aborts: metrics.clientAborts.length,
    rejects: metrics.clientRejects.length,
    serverAborts: metrics.serverAborts.length,
    serverCloses: metrics.serverCloses.length,
    pendingClose: metrics.pendingClose,
    abortToCloseMs: metrics.abortToCloseMs,
    loaderDurationMs: metrics.loaderDurationMs,
  };
}

try {
  const actualLoader = await compileActualLoader(source, 'actual');
  assert.equal(actualLoader.HOMEPAGE_PRODUCT_CONCURRENCY, EXPECTED_CONCURRENCY, 'source contract: homepage logical concurrency');
  assert.equal(actualLoader.CATALOG_REQUEST_TIMEOUT_MS, EXPECTED_REQUEST_TIMEOUT_MS, 'source contract: per-request timeout');
  assert.equal(actualLoader.HOMEPAGE_SECONDARY_BUDGET_MS, EXPECTED_BATCH_BUDGET_MS, 'source contract: batch budget');

  const repeat = Number(process.env.SSR_BUDGET_REPEAT ?? '1');
  assert.ok(Number.isInteger(repeat) && repeat >= 1 && repeat <= 3, 'SSR_BUDGET_REPEAT must be an integer from 1 to 3');
  const positives = [];
  for (let run = 1; run <= repeat; run += 1) {
    for (const responseMode of ['never-reply', 'body-hang']) {
      const metrics = await exerciseCancellation(actualLoader, `${responseMode}-run-${run}`, responseMode);
      assertLogicalAndCancellationContract(metrics);
      positives.push(publicSummary(metrics));
    }
  }

  const faultNeedle = 'export const HOMEPAGE_PRODUCT_CONCURRENCY = 4;';
  assert.equal(source.split(faultNeedle).length - 1, 1, 'controlled negative: expected one concurrency constant');
  const faultySource = source.replace(faultNeedle, 'export const HOMEPAGE_PRODUCT_CONCURRENCY = 5;');
  const faultyLoader = await compileActualLoader(faultySource, 'intentional-logical-5');
  const negativeMetrics = await exerciseCancellation(faultyLoader, 'intentional-logical-5', 'never-reply');
  let negativeError;
  try {
    assertLogicalAndCancellationContract(negativeMetrics);
  } catch (error) {
    negativeError = error;
  }
  assert.ok(
    negativeError?.name === 'AssertionError' && /logical client peak 5 exceeds 4/.test(negativeError.message),
    'controlled negative: the logical concurrency guard must reject a source-derived limit of five',
  );

  const result = {
    schemaVersion: 1,
    node: process.version,
    sourcePath: 'src/shared/api/collections/ssr-budget.ts',
    sourceSha256,
    loggerImportsStubbed: 2,
    positive: positives,
    controlledNegative: {
      sourceMutation: 'HOMEPAGE_PRODUCT_CONCURRENCY 4 -> 5 in owned temporary transpilation only',
      observedLogicalPeak: negativeMetrics.logicalPeak,
      failureClass: negativeError.name,
      failureMessage: negativeError.message,
      serverPeak: negativeMetrics.serverPeak,
    },
  };
  if (process.env.SSR_BUDGET_TRACE_PATH) {
    writeFileSync(resolve(process.env.SSR_BUDGET_TRACE_PATH), `${allEvents.map((event) => JSON.stringify(event)).join('\n')}\n`, { encoding: 'utf8', flag: 'wx' });
  }
  if (process.env.SSR_BUDGET_RESULT_PATH) {
    writeFileSync(resolve(process.env.SSR_BUDGET_RESULT_PATH), `${JSON.stringify(result, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  }
  for (const summary of positives) {
    console.log(
      `TC-SR ${summary.scenario}: logicalPeak=${summary.logicalPeak}, serverPeak=${summary.serverPeak}, starts=${summary.starts}, aborts=${summary.aborts}, closes=${summary.serverCloses}, pendingClose=${summary.pendingClose}, duration=${summary.loaderDurationMs}ms`,
    );
  }
  console.log(`TC-SR controlled negative: ${negativeError.name} (${negativeError.message})`);
  console.log(`TC-SR source-bound cancellation contract passed on ${process.version} (${sourceSha256})`);
} finally {
  rmSync(ownedTempDir, { recursive: true, force: true });
}
