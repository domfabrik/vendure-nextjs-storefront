type DescriptionComparisonStatus = 'READY' | 'COMPLETE' | 'UNAVAILABLE';
type DescriptionComparisonChoice = 'LEFT' | 'RIGHT' | 'EQUAL' | 'SKIP';
interface DescriptionComparison {
  status: DescriptionComparisonStatus;
  ballotToken: string | null;
  productId: string | null;
  slug: string | null;
  productName: string | null;
  imageUrl: string | null;
  leftText: string | null;
  rightText: string | null;
  sourceUrl: string | null;
  sourceKind: 'VENDOR' | 'CATALOG' | null;
  parsedCharacteristics: Array<{ name: string; value: string }>;
  completed: number;
  total: number;
}
interface DescriptionComparisonVoteInput {
  ballotToken: string;
  choice: DescriptionComparisonChoice;
  leftComment: string;
  rightComment: string;
}
interface DescriptionComparisonVoteResult {
  saved: boolean;
  duplicate: boolean;
  completed: number;
}

export type DescriptionReviewRetryAction = { type: 'load'; clearComments?: boolean } | { type: 'submit'; choice: DescriptionComparisonChoice };

export interface DescriptionReviewError {
  message: string;
  retry: DescriptionReviewRetryAction;
}

export interface DescriptionReviewState {
  comparison: DescriptionComparison | null;
  leftComment: string;
  rightComment: string;
  loading: boolean;
  submitting: boolean;
  error: DescriptionReviewError | null;
  notice: string | null;
}

export interface DescriptionReviewControllerDependencies {
  prepare: () => Promise<DescriptionComparison>;
  submit: (input: DescriptionComparisonVoteInput) => Promise<DescriptionComparisonVoteResult>;
  isConflictError?: (error: unknown) => boolean;
}

export interface DescriptionReviewController {
  getState: () => DescriptionReviewState;
  subscribe: (listener: (state: DescriptionReviewState) => void) => () => void;
  loadNext: (clearComments?: boolean) => Promise<void>;
  setComment: (side: 'left' | 'right', comment: string) => void;
  submit: (choice: DescriptionComparisonChoice) => Promise<void>;
  retry: () => Promise<void>;
}

const initialState: DescriptionReviewState = {
  comparison: null,
  leftComment: '',
  rightComment: '',
  loading: true,
  submitting: false,
  error: null,
  notice: null,
};

export function createDescriptionReviewController(dependencies: DescriptionReviewControllerDependencies): DescriptionReviewController {
  let state = { ...initialState };
  let loadInFlight: Promise<void> | null = null;
  const listeners = new Set<(nextState: DescriptionReviewState) => void>();

  function emit() {
    for (const listener of listeners) listener(state);
  }

  function update(partial: Partial<DescriptionReviewState>) {
    state = { ...state, ...partial };
    emit();
  }

  async function loadNext(clearComments = false): Promise<void> {
    if (loadInFlight) return loadInFlight;

    loadInFlight = (async () => {
      update({ comparison: null, loading: true, error: null, notice: null });

      try {
        const next = await dependencies.prepare();
        update({
          comparison: next,
          loading: false,
          ...(clearComments ? { leftComment: '', rightComment: '' } : {}),
        });
      } catch {
        update({
          comparison: null,
          loading: false,
          error: { message: 'Не удалось загрузить сравнение. Попробуйте ещё раз.', retry: { type: 'load', clearComments } },
        });
      } finally {
        loadInFlight = null;
      }
    })();

    return loadInFlight;
  }

  async function submit(choice: DescriptionComparisonChoice): Promise<void> {
    const comparison = state.comparison;
    if (!comparison?.ballotToken || state.loading || state.submitting || state.error) return;

    const input: DescriptionComparisonVoteInput = {
      ballotToken: comparison.ballotToken,
      choice,
      leftComment: state.leftComment,
      rightComment: state.rightComment,
    };
    update({ submitting: true, error: null, notice: null });

    try {
      const result = await dependencies.submit(input);
      if (!result.saved && !result.duplicate) {
        update({
          submitting: false,
          error: { message: 'Ответ не сохранён. Проверьте соединение и повторите попытку.', retry: { type: 'submit', choice } },
        });
        return;
      }

      const duplicate = result.duplicate;
      update({ comparison: null, leftComment: '', rightComment: '', loading: true });
      await loadNext();
      if (duplicate && !state.error) update({ notice: 'Этот ответ уже был сохранён. Загружена следующая пара.' });
    } catch (error) {
      const conflict = dependencies.isConflictError?.(error) ?? false;
      update({
        submitting: false,
        error: conflict
          ? { message: 'Эта пара уже была обработана. Поля сохранены — повторите попытку.', retry: { type: 'load', clearComments: true } }
          : { message: 'Не удалось сохранить ответ. Поля сохранены — повторите попытку.', retry: { type: 'submit', choice } },
      });
    } finally {
      if (state.submitting) update({ submitting: false });
    }
  }

  async function retry(): Promise<void> {
    const action = state.error?.retry;
    if (!action) return;
    if (action.type === 'load') {
      await loadNext(action.clearComments);
      return;
    }
    update({ error: null });
    await submit(action.choice);
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    loadNext,
    setComment: (side, comment) => update(side === 'left' ? { leftComment: comment } : { rightComment: comment }),
    submit,
    retry,
  };
}
