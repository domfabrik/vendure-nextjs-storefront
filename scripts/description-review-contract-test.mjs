import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DescriptionEvidence } from '../src/app/description-review/description-evidence.ts';
import { resolveDescriptionExperimentKey } from '../src/app/description-review/description-experiment-key.ts';
import { DescriptionPanel } from '../src/app/description-review/description-panel.ts';
import { isDescriptionReviewEnabled } from '../src/app/description-review/description-review-gate.ts';
import { createDescriptionReviewController } from '../src/shared/api/description-experiment/controller.ts';
import { displayDescriptionText } from '../src/shared/api/description-experiment/model.ts';

const pageSource = readFileSync(new URL('../src/app/description-review/page.tsx', import.meta.url), 'utf8');
const reviewSource = readFileSync(new URL('../src/app/description-review/description-review.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/shared/api/description-experiment/api.ts', import.meta.url), 'utf8');

const choices = ['LEFT', 'RIGHT', 'EQUAL', 'SKIP'];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function ready(token, completed = 0, total = 512) {
  return {
    status: 'READY',
    ballotToken: token,
    productId: `product-${token}`,
    slug: `slug-${token}`,
    productName: 'Общий товар',
    imageUrl: null,
    leftText: 'Левая строка\n\nЛевый абзац',
    rightText: '<script>alert(1)</script>',
    sourceUrl: null,
    sourceKind: null,
    parsedCharacteristics: [],
    completed,
    total,
  };
}

function complete(completed = 512, total = 512) {
  return {
    status: 'COMPLETE',
    ballotToken: null,
    productId: null,
    slug: null,
    productName: null,
    imageUrl: null,
    leftText: null,
    rightText: null,
    sourceUrl: null,
    sourceKind: null,
    parsedCharacteristics: [],
    completed,
    total,
  };
}

function unavailable(completed = 4, total = 512) {
  return { ...complete(completed, total), status: 'UNAVAILABLE' };
}

async function load(controller) {
  await controller.loadNext();
  assert.equal(controller.getState().loading, false);
}

async function testSavedThenFailedPrepareHidesOldBallot() {
  const nextPrepare = deferred();
  const submissions = [];
  let prepareCalls = 0;
  const controller = createDescriptionReviewController({
    prepare: () => {
      prepareCalls += 1;
      return prepareCalls === 1 ? Promise.resolve(ready('ballot-1')) : nextPrepare.promise;
    },
    submit: async (input) => {
      submissions.push(input);
      return { saved: true, duplicate: false, completed: 1 };
    },
  });

  await load(controller);
  controller.setComment('left', 'left comment');
  controller.setComment('right', 'right comment');
  const saving = controller.submit('LEFT');
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(controller.getState().comparison, null, 'saved response must hide the old ballot before prepare resolves');
  assert.equal(controller.getState().loading, true);
  assert.equal(controller.getState().leftComment, '', 'saved response clears the left comment');
  assert.equal(controller.getState().rightComment, '', 'saved response clears the right comment');
  assert.equal(submissions.length, 1);

  const staleAttempt = controller.submit('RIGHT');
  assert.equal(await staleAttempt, undefined);
  assert.equal(submissions.length, 1, 'old ballot cannot be submitted while next prepare is pending');

  nextPrepare.reject(new Error('prepare unavailable'));
  await saving;
  assert.equal(controller.getState().comparison, null);
  assert.equal(controller.getState().error?.retry.type, 'load');
}

async function testSubmitFailurePreservesPairAndComments() {
  const submissions = [];
  let prepareCalls = 0;
  const controller = createDescriptionReviewController({
    prepare: async () => {
      prepareCalls += 1;
      return prepareCalls === 1 ? ready('ballot-failure') : complete(1, 1);
    },
    submit: async (input) => {
      submissions.push(input);
      if (submissions.length === 1) throw new Error('network failed');
      return { saved: true, duplicate: false, completed: 1 };
    },
  });

  await load(controller);
  controller.setComment('left', 'keep left');
  controller.setComment('right', 'keep right');
  await controller.submit('RIGHT');
  assert.equal(controller.getState().comparison?.ballotToken, 'ballot-failure');
  assert.equal(controller.getState().leftComment, 'keep left');
  assert.equal(controller.getState().rightComment, 'keep right');
  assert.equal(controller.getState().error?.retry.type, 'submit');

  await controller.retry();
  assert.equal(controller.getState().comparison?.status, 'COMPLETE');
  assert.equal(controller.getState().leftComment, '');
  assert.equal(controller.getState().rightComment, '');
  assert.equal(submissions[1].leftComment, 'keep left');
  assert.equal(submissions[1].rightComment, 'keep right');
}

async function testDoubleClickSubmitsOnce() {
  const submitGate = deferred();
  const submissions = [];
  let prepareCalls = 0;
  const controller = createDescriptionReviewController({
    prepare: async () => {
      prepareCalls += 1;
      return prepareCalls === 1 ? ready('ballot-double') : complete(1, 1);
    },
    submit: async (input) => {
      submissions.push(input);
      return submitGate.promise;
    },
  });

  await load(controller);
  const first = controller.submit('LEFT');
  const second = controller.submit('RIGHT');
  assert.equal(submissions.length, 1, 'double click starts one submit callback');
  submitGate.resolve({ saved: true, duplicate: false, completed: 1 });
  await Promise.all([first, second]);
  assert.equal(submissions[0].choice, 'LEFT');
}

async function testDuplicateConflictAndReset() {
  let prepareCalls = 0;
  const duplicateController = createDescriptionReviewController({
    prepare: async () => (prepareCalls++ === 0 ? ready('ballot-duplicate') : complete(1, 1)),
    submit: async () => ({ saved: false, duplicate: true, completed: 1 }),
  });
  await load(duplicateController);
  duplicateController.setComment('left', 'duplicate left');
  await duplicateController.submit('EQUAL');
  assert.match(duplicateController.getState().notice, /уже был сохранён/);
  assert.equal(duplicateController.getState().comparison?.status, 'COMPLETE');
  assert.equal(duplicateController.getState().leftComment, '');

  let conflictPrepareCalls = 0;
  const conflictController = createDescriptionReviewController({
    isConflictError: (error) => error instanceof Error && error.message === 'DESCRIPTION_COMPARISON_CONFLICT',
    prepare: async () => (conflictPrepareCalls++ === 0 ? ready('ballot-conflict') : ready('ballot-after-conflict', 1)),
    submit: async () => {
      throw new Error('DESCRIPTION_COMPARISON_CONFLICT');
    },
  });
  await load(conflictController);
  conflictController.setComment('left', 'retain on conflict');
  await conflictController.submit('SKIP');
  assert.equal(conflictController.getState().comparison?.ballotToken, 'ballot-conflict');
  assert.equal(conflictController.getState().leftComment, 'retain on conflict');
  assert.equal(conflictController.getState().error?.retry.type, 'load');
  await conflictController.retry();
  assert.equal(conflictController.getState().comparison?.ballotToken, 'ballot-after-conflict');
  assert.equal(conflictController.getState().leftComment, '');
}

async function testCompleteUnavailableAndProgress() {
  for (const result of [complete(512, 512), unavailable(7, 512)]) {
    const controller = createDescriptionReviewController({ prepare: async () => result, submit: async () => ({ saved: true, duplicate: false, completed: result.completed }) });
    await load(controller);
    assert.equal(controller.getState().comparison?.status, result.status);
    assert.equal(controller.getState().comparison?.completed, result.completed);
    assert.equal(controller.getState().comparison?.total, 512);
  }
}

async function testLogicalSidesAndBothCommentsForEveryChoice() {
  for (const choice of choices) {
    let prepareCalls = 0;
    const submissions = [];
    const controller = createDescriptionReviewController({
      prepare: async () => (prepareCalls++ === 0 ? ready(`ballot-${choice}`) : complete(1, 1)),
      submit: async (input) => {
        submissions.push(input);
        return { saved: true, duplicate: false, completed: 1 };
      },
    });
    await load(controller);
    controller.setComment('left', 'left stays logical');
    controller.setComment('right', 'right stays logical');
    await controller.submit(choice);
    assert.deepEqual(submissions[0], {
      ballotToken: `ballot-${choice}`,
      choice,
      leftComment: 'left stays logical',
      rightComment: 'right stays logical',
    });
  }
}

assert.equal(displayDescriptionText('<script>alert(1)</script>'), '<script>alert(1)</script>');
assert.equal(displayDescriptionText(''), 'Описание отсутствует');
assert.equal(isDescriptionReviewEnabled('https://test.domfabrik.ru'), true);
assert.equal(isDescriptionReviewEnabled(' https://test.domfabrik.ru '), true);
assert.equal(isDescriptionReviewEnabled('https://domfabrik.ru'), false);
assert.equal(isDescriptionReviewEnabled('https://test.domfabrik.ru.evil.example'), false);
assert.equal(isDescriptionReviewEnabled(undefined), false);
assert.match(pageSource, /isDescriptionReviewEnabled\(envServer\.SITE_URL\)/);
assert.match(pageSource, /if \(!isDescriptionReviewEnabled\(envServer\.SITE_URL\)\) notFound\(\)/);
assert.match(pageSource, /robots: \{ index: false, follow: false \}/);
assert.match(pageSource, /searchParams/);
assert.match(reviewSource, /Режим проверки: ответы не входят в статистику исследования/);
assert.match(apiSource, /z\.enum\(\[DESCRIPTION_EXPERIMENT_KEY, DESCRIPTION_QA_EXPERIMENT_KEY\]\)/);
assert.match(reviewSource, /import \{ DescriptionPanel \} from '\.\/description-panel'/);
assert.match(reviewSource, /headingId="description-review-variant-left-heading"/);
assert.match(reviewSource, /headingId="description-review-variant-right-heading"/);
assert.deepEqual(resolveDescriptionExperimentKey(undefined, 'description-third-20261005-v1'), { experimentKey: 'description-third-20261005-v1', qaMode: false });
assert.deepEqual(resolveDescriptionExperimentKey('1', 'description-third-20261005-v1'), { experimentKey: 'description-study-qa-20261005-v1', qaMode: true });
assert.deepEqual(resolveDescriptionExperimentKey('anything-else', 'description-third-20261005-v1'), { experimentKey: 'description-third-20261005-v1', qaMode: false });

const renderedPanel = renderToStaticMarkup(
  createElement(DescriptionPanel, {
    comment: 'Комментарий',
    disabled: false,
    headingId: 'description-review-variant-left-heading',
    label: 'Вариант 1',
    onChoose: () => {},
    onCommentChange: () => {},
    text: '<script>alert(1)</script>\n\nВторой абзац',
  }),
);
assert.match(renderedPanel, /aria-labelledby="description-review-variant-left-heading"/);
assert.match(renderedPanel, /aria-describedby="description-review-variant-left-heading"/);
assert.match(renderedPanel, /aria-label="Комментарий к Вариант 1"/);
assert.match(renderedPanel, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(renderedPanel, /<script>alert\(1\)<\/script>/);

const renderedEvidence = renderToStaticMarkup(
  createElement(DescriptionEvidence, {
    parsedCharacteristics: [
      { name: 'Ширина', value: '120 см' },
      { name: 'Особенность', value: '<script>alert(2)</script>' },
    ],
    productName: 'Товар <script>alert(3)</script>',
    sourceKind: 'VENDOR',
    sourceUrl: 'https://vendor.example/item?name=%3Cscript%3E',
  }),
);
assert.match(renderedEvidence, /Исходная информация/);
assert.match(renderedEvidence, /target="_blank"/);
assert.match(renderedEvidence, /rel="noopener noreferrer"/);
assert.match(renderedEvidence, /Ширина/);
assert.match(renderedEvidence, /120 см/);
assert.match(renderedEvidence, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
assert.doesNotMatch(renderedEvidence, /<script>alert\(2\)<\/script>/);
assert.doesNotMatch(renderedEvidence, /<script>alert\(3\)<\/script>/);

const renderedEmptyEvidence = renderToStaticMarkup(
  createElement(DescriptionEvidence, {
    parsedCharacteristics: [],
    productName: 'Товар',
    sourceKind: 'CATALOG',
    sourceUrl: 'https://domfabrik.ru/products/item',
  }),
);
assert.match(renderedEmptyEvidence, /Исходная карточка DomFabrik/);
assert.match(renderedEmptyEvidence, /Подтверждённые характеристики не найдены/);

const renderedUnsafeEvidence = renderToStaticMarkup(
  createElement(DescriptionEvidence, {
    parsedCharacteristics: [],
    productName: 'Товар',
    sourceKind: 'VENDOR',
    sourceUrl: 'https://user:password@vendor.example/item',
  }),
);
assert.doesNotMatch(renderedUnsafeEvidence, /Исходная информация/);

await testSavedThenFailedPrepareHidesOldBallot();
await testSubmitFailurePreservesPairAndComments();
await testDoubleClickSubmitsOnce();
await testDuplicateConflictAndReset();
await testCompleteUnavailableAndProgress();
await testLogicalSidesAndBothCommentsForEveryChoice();

console.log('Description review controller flow tests passed');
