export const DESCRIPTION_EXPERIMENT_KEY = 'description-third-20261005-v1';
export const DESCRIPTION_QA_EXPERIMENT_KEY = 'description-study-qa-20261005-v1';

export type DescriptionComparisonStatus = 'READY' | 'COMPLETE' | 'UNAVAILABLE';

export type DescriptionComparisonChoice = 'LEFT' | 'RIGHT' | 'EQUAL' | 'SKIP';

export type DescriptionSourceKind = 'VENDOR' | 'CATALOG';

export interface DescriptionCharacteristic {
  name: string;
  value: string;
}

export interface DescriptionComparison {
  status: DescriptionComparisonStatus;
  ballotToken: string | null;
  productId: string | null;
  slug: string | null;
  productName: string | null;
  imageUrl: string | null;
  leftText: string | null;
  rightText: string | null;
  sourceUrl: string | null;
  sourceKind: DescriptionSourceKind | null;
  parsedCharacteristics: DescriptionCharacteristic[];
  completed: number;
  total: number;
}

export interface DescriptionComparisonVoteInput {
  ballotToken: string;
  choice: DescriptionComparisonChoice;
  leftComment: string;
  rightComment: string;
}

export type DescriptionComparisonVoteResult = { outcome: 'RESULT'; saved: boolean; duplicate: boolean; completed: number } | { outcome: 'CONFLICT' };

export function createDescriptionComparisonVote(input: DescriptionComparisonVoteInput): DescriptionComparisonVoteInput {
  return {
    ballotToken: input.ballotToken,
    choice: input.choice,
    leftComment: input.leftComment,
    rightComment: input.rightComment,
  };
}

export const DESCRIPTION_COMPARISON_ERROR_CODES = { requestFailed: 'DESCRIPTION_COMPARISON_REQUEST_FAILED' } as const;

export function displayDescriptionText(text: string | null | undefined): string {
  return text && text.length > 0 ? text : 'Описание отсутствует';
}
