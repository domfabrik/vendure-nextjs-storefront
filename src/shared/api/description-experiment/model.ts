export const DESCRIPTION_EXPERIMENT_KEY = 'description-third-20261005-v1';

export type DescriptionComparisonStatus = 'READY' | 'COMPLETE' | 'UNAVAILABLE';

export type DescriptionComparisonChoice = 'LEFT' | 'RIGHT' | 'EQUAL' | 'SKIP';

export interface DescriptionComparison {
  status: DescriptionComparisonStatus;
  ballotToken: string | null;
  productId: string | null;
  slug: string | null;
  productName: string | null;
  imageUrl: string | null;
  leftText: string | null;
  rightText: string | null;
  completed: number;
  total: number;
}

export interface DescriptionComparisonVoteInput {
  ballotToken: string;
  choice: DescriptionComparisonChoice;
  leftComment: string;
  rightComment: string;
}

export interface DescriptionComparisonVoteResult {
  saved: boolean;
  duplicate: boolean;
  completed: number;
}

export function createDescriptionComparisonVote(input: DescriptionComparisonVoteInput): DescriptionComparisonVoteInput {
  return {
    ballotToken: input.ballotToken,
    choice: input.choice,
    leftComment: input.leftComment,
    rightComment: input.rightComment,
  };
}

export const DESCRIPTION_COMPARISON_ERROR_CODES = {
  conflict: 'DESCRIPTION_COMPARISON_CONFLICT',
  requestFailed: 'DESCRIPTION_COMPARISON_REQUEST_FAILED',
} as const;

export function displayDescriptionText(text: string | null | undefined): string {
  return text && text.length > 0 ? text : 'Описание отсутствует';
}

export function isDescriptionComparisonConflict(error: unknown): boolean {
  return error instanceof Error && error.message === DESCRIPTION_COMPARISON_ERROR_CODES.conflict;
}
