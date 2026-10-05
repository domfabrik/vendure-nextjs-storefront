import { Box, Button, TextField, Typography } from '@mui/material';
import { type ChangeEvent, createElement, type ElementType } from 'react';

export const panelSx = {
  display: 'flex',
  minWidth: 0,
  flexDirection: 'column',
  gap: 2,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
  bgcolor: 'background.paper',
};

export interface DescriptionPanelProps {
  comment: string;
  disabled: boolean;
  headingId: string;
  label: string;
  onChoose: () => void;
  onCommentChange: (value: string) => void;
  text: string | null;
}

function displayDescriptionText(text: string | null): string {
  return text && text.length > 0 ? text : 'Описание отсутствует';
}

const BoxElement = Box as ElementType;
const TypographyElement = Typography as ElementType;

export function DescriptionPanel(props: DescriptionPanelProps) {
  const handleCommentChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.onCommentChange(event.target.value);

  return createElement(
    BoxElement,
    {
      'aria-labelledby': props.headingId,
      component: 'section',
      sx: { ...panelSx, flex: 1 },
    },
    createElement(
      TypographyElement,
      {
        component: 'h2',
        id: props.headingId,
        sx: { fontSize: '1.125rem', fontWeight: 700 },
      },
      props.label,
    ),
    createElement(
      TypographyElement,
      {
        component: 'div',
        sx: { minHeight: { xs: 120, sm: 160 }, whiteSpace: 'pre-line', overflowWrap: 'anywhere' },
      },
      displayDescriptionText(props.text),
    ),
    createElement(TextField, {
      disabled: props.disabled,
      fullWidth: true,
      label: 'Что здесь хорошо или плохо?',
      maxRows: 6,
      minRows: 3,
      multiline: true,
      onChange: handleCommentChange,
      value: props.comment,
      slotProps: {
        htmlInput: {
          'aria-describedby': props.headingId,
          'aria-label': `Комментарий к ${props.label}`,
          maxLength: 2000,
        },
      },
    }),
    createElement(
      Button,
      {
        'aria-describedby': props.headingId,
        disabled: props.disabled,
        onClick: props.onChoose,
        variant: 'contained',
      },
      'Выбрать этот вариант',
    ),
  );
}
