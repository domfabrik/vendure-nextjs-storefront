'use client';

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { createDescriptionReviewController, DESCRIPTION_EXPERIMENT_KEY, type DescriptionComparison, prepareDescriptionComparison, submitDescriptionComparison } from '@/shared/api';
import { DescriptionEvidence } from './description-evidence';
import { DescriptionPanel } from './description-panel';

interface DescriptionReviewProps {
  experimentKey?: string;
  qaMode?: boolean;
}

function imageCanRender(imageUrl: string | null): imageUrl is string {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('/')) return true;

  try {
    const parsed = new URL(imageUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function statusMessage(comparison: DescriptionComparison): string {
  if (comparison.status === 'COMPLETE') return `Спасибо! Все доступные сравнения завершены (${comparison.completed} из ${comparison.total}).`;
  return 'Сравнение временно недоступно.';
}

export function DescriptionReview({ experimentKey = DESCRIPTION_EXPERIMENT_KEY, qaMode = false }: DescriptionReviewProps) {
  const controller = useMemo(
    () =>
      createDescriptionReviewController({
        prepare: () => prepareDescriptionComparison(experimentKey),
        submit: submitDescriptionComparison,
      }),
    [experimentKey],
  );
  const [state, setState] = useState(controller.getState());

  useEffect(() => controller.subscribe(setState), [controller]);
  useEffect(() => {
    void controller.loadNext();
  }, [controller]);

  const comparison = state.comparison;
  const controlsDisabled = state.loading || state.submitting || Boolean(state.error) || comparison?.status !== 'READY';
  const showStatus = !comparison || comparison.status !== 'READY';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: { xs: 2, sm: 4 } }}>
      <Box>
        {qaMode && <Alert severity="info">Режим проверки: ответы не входят в статистику исследования.</Alert>}
        <Typography
          component="h1"
          sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, fontWeight: 700 }}
        >
          Сравнение описаний
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Выберите вариант, который лучше описывает товар. Можно оставить комментарий к каждому варианту.
        </Typography>
      </Box>

      {state.notice && <Alert severity="info">{state.notice}</Alert>}

      {state.error && (
        <Alert
          action={
            <Button
              color="inherit"
              disabled={state.loading || state.submitting}
              onClick={() => void controller.retry()}
              size="small"
            >
              Повторить
            </Button>
          }
          severity="error"
        >
          {state.error.message}
        </Alert>
      )}

      {state.loading && (
        <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 2, py: 8 }}>
          <CircularProgress aria-label="Загрузка" />
          <Typography color="text.secondary">Загружаем следующую пару…</Typography>
        </Box>
      )}

      {!state.loading && showStatus && !state.error && comparison && <Alert severity={comparison.status === 'COMPLETE' ? 'success' : 'warning'}>{statusMessage(comparison)}</Alert>}

      {!state.loading && comparison?.status === 'READY' && (
        <>
          {(comparison.productName || imageCanRender(comparison.imageUrl)) && (
            <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {imageCanRender(comparison.imageUrl) && (
                <Box
                  alt={comparison.productName ?? 'Товар'}
                  component="img"
                  src={comparison.imageUrl}
                  sx={{ aspectRatio: '4 / 3', borderRadius: 1, maxWidth: 480, objectFit: 'contain', width: '100%' }}
                />
              )}
            </Box>
          )}
          <DescriptionEvidence
            parsedCharacteristics={comparison.parsedCharacteristics}
            productName={comparison.productName}
            sourceKind={comparison.sourceKind}
            sourceUrl={comparison.sourceUrl}
          />
          <Typography
            aria-live="polite"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            Выполнено: {comparison.completed} из {comparison.total}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 } }}>
            <DescriptionPanel
              comment={state.leftComment}
              disabled={controlsDisabled}
              headingId="description-review-variant-left-heading"
              label="Вариант 1"
              onCommentChange={(value) => controller.setComment('left', value)}
              onChoose={() => void controller.submit('LEFT')}
              text={comparison.leftText}
            />
            <DescriptionPanel
              comment={state.rightComment}
              disabled={controlsDisabled}
              headingId="description-review-variant-right-heading"
              label="Вариант 2"
              onCommentChange={(value) => controller.setComment('right', value)}
              onChoose={() => void controller.submit('RIGHT')}
              text={comparison.rightText}
            />
          </Box>

          <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
            <Button
              disabled={controlsDisabled}
              onClick={() => void controller.submit('EQUAL')}
              variant="outlined"
            >
              Одинаково
            </Button>
            <Button
              disabled={controlsDisabled}
              onClick={() => void controller.submit('SKIP')}
              variant="text"
            >
              Пропустить
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
