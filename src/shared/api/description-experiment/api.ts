'use server';

import * as z from 'zod';
import { sessionRequest } from '../api-client';
import {
  DESCRIPTION_COMPARISON_ERROR_CODES,
  DESCRIPTION_EXPERIMENT_KEY,
  DESCRIPTION_QA_EXPERIMENT_KEY,
  type DescriptionComparison,
  type DescriptionComparisonVoteInput,
  type DescriptionComparisonVoteResult,
} from './model';
import { PREPARE_DESCRIPTION_COMPARISON, SUBMIT_DESCRIPTION_COMPARISON } from './queries';

const sourceUrlSchema = z.string().refine((value) => {
  if ([...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.username === '' && parsed.password === '';
  } catch {
    return false;
  }
}, 'sourceUrl must be a userinfo-free HTTP(S) URL');
const experimentKeySchema = z.enum([DESCRIPTION_EXPERIMENT_KEY, DESCRIPTION_QA_EXPERIMENT_KEY]);

const comparisonSchema = z.object({
  studySessionId: z.string().uuid().nullable().optional(),
  status: z.enum(['READY', 'COMPLETE', 'UNAVAILABLE']),
  ballotToken: z.string().min(1).nullable(),
  productId: z.string().min(1).nullable(),
  slug: z.string().min(1).nullable(),
  productName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  leftText: z.string().nullable(),
  rightText: z.string().nullable(),
  sourceUrl: sourceUrlSchema.nullable(),
  sourceKind: z.enum(['VENDOR', 'CATALOG']).nullable(),
  parsedCharacteristics: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        value: z.string().min(1).max(2000),
      }),
    )
    .max(100)
    .superRefine((items, context) => {
      const seen = new Set<string>();
      for (const [index, item] of items.entries()) {
        const key = `${item.name}\u0000${item.value}`;
        if (seen.has(key)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'duplicate characteristic', path: [index] });
        seen.add(key);
      }
    }),
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const voteInputSchema = z.object({
  studySessionId: z.string().uuid().optional(),
  ballotToken: z.string().min(1),
  choice: z.enum(['LEFT', 'RIGHT', 'EQUAL', 'SKIP']),
  leftComment: z.string().max(2000),
  rightComment: z.string().max(2000),
});

const voteResultSchema = z.object({
  saved: z.boolean(),
  duplicate: z.boolean(),
  completed: z.number().int().nonnegative(),
});

function firstGraphqlMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('response' in error)) return '';

  const response = (error as { response?: { errors?: Array<{ message?: unknown; extensions?: { code?: unknown } }> } }).response;
  const graphqlError = response?.errors?.[0];
  const code = graphqlError?.extensions?.code;
  const message = graphqlError?.message;

  return [typeof code === 'string' ? code : '', typeof message === 'string' ? message : ''].join(' ');
}

function isConflictError(error: unknown): boolean {
  return /CONFLICT|ALREADY_SUBMITTED|VERSION_MISMATCH/i.test(firstGraphqlMessage(error));
}

export async function prepareDescriptionComparison(experimentKey = DESCRIPTION_EXPERIMENT_KEY, studySessionId?: string): Promise<DescriptionComparison> {
  const parsedExperimentKey = experimentKeySchema.safeParse(experimentKey);
  if (!parsedExperimentKey.success) throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.requestFailed);

  try {
    const result = await sessionRequest<{ prepareDescriptionComparison: unknown }>(PREPARE_DESCRIPTION_COMPARISON, {
      experimentKey: parsedExperimentKey.data,
      studySessionId,
    });

    const comparison = comparisonSchema.parse(result.prepareDescriptionComparison);
    if (studySessionId && !comparison.studySessionId) throw new Error('missing canonical studySessionId');
    return comparison;
  } catch {
    throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.requestFailed);
  }
}

export async function submitDescriptionComparison(input: DescriptionComparisonVoteInput): Promise<DescriptionComparisonVoteResult> {
  let parsedInput: DescriptionComparisonVoteInput;
  try {
    parsedInput = voteInputSchema.parse(input);
  } catch {
    throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.requestFailed);
  }

  try {
    const result = await sessionRequest<{ submitDescriptionComparison: unknown }>(SUBMIT_DESCRIPTION_COMPARISON, { input: parsedInput });
    const parsedResult = voteResultSchema.parse(result.submitDescriptionComparison);
    return { outcome: 'RESULT', ...parsedResult };
  } catch (error) {
    if (isConflictError(error)) return { outcome: 'CONFLICT' };
    throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.requestFailed);
  }
}
