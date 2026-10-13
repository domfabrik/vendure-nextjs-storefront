export const DESCRIPTION_QA_EXPERIMENT_KEY = 'description-study-qa-20261005-v1';

export function resolveDescriptionExperimentKey(qa: unknown, actualKey: string): { experimentKey: string; qaMode: boolean } {
  return qa === '1' ? { experimentKey: DESCRIPTION_QA_EXPERIMENT_KEY, qaMode: true } : { experimentKey: actualKey, qaMode: false };
}
