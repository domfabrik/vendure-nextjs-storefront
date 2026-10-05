'use server';

import * as z from 'zod';
import { sessionRequest } from '../api-client';
import {
  DESCRIPTION_COMPARISON_ERROR_CODES,
  DESCRIPTION_EXPERIMENT_KEY,
  type DescriptionComparison,
  type DescriptionComparisonVoteInput,
  type DescriptionComparisonVoteResult,
} from './model';
import { PREPARE_DESCRIPTION_COMPARISON, SUBMIT_DESCRIPTION_COMPARISON } from './queries';

const comparisonSchema = z.object({
  status: z.enum(['READY', 'COMPLETE', 'UNAVAILABLE']),
  ballotToken: z.string().min(1).nullable(),
  productId: z.string().min(1).nullable(),
  slug: z.string().min(1).nullable(),
  productName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  leftText: z.string().nullable(),
  rightText: z.string().nullable(),
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const voteInputSchema = z.object({
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

export async function prepareDescriptionComparison(): Promise<DescriptionComparison> {
  try {
    const result = await sessionRequest<{ prepareDescriptionComparison: unknown }>(PREPARE_DESCRIPTION_COMPARISON, {
      experimentKey: DESCRIPTION_EXPERIMENT_KEY,
    });

    return comparisonSchema.parse(result.prepareDescriptionComparison);
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
    return voteResultSchema.parse(result.submitDescriptionComparison);
  } catch (error) {
    if (isConflictError(error)) throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.conflict);
    throw new Error(DESCRIPTION_COMPARISON_ERROR_CODES.requestFailed);
  }
}
