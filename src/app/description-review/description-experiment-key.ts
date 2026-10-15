export const DESCRIPTION_QA_EXPERIMENT_KEY = 'description-sol-vs-crewai-20261014-v1-qa';

export function resolveDescriptionExperimentKey(qa: unknown, actualKey: string, round?: unknown, sessionId?: unknown): { experimentKey: string; qaMode: boolean; round: string } {
  if (round !== undefined && round !== '20261005' && round !== '20261014') throw new Error('INVALID_DESCRIPTION_ROUND');
  // Existing continuation URLs predate the round parameter and must retain their identity scope.
  const previous = round === '20261005' || (round === undefined && (sessionId !== undefined || actualKey === 'description-third-20261005-v1'));
  const experimentKey = previous ? 'description-third-20261005-v1' : 'description-sol-vs-crewai-20261014-v1';
  return {
    experimentKey: qa === '1' ? (previous ? 'description-study-qa-20261005-v1' : DESCRIPTION_QA_EXPERIMENT_KEY) : experimentKey,
    qaMode: qa === '1',
    round: previous ? '20261005' : '20261014',
  };
}
