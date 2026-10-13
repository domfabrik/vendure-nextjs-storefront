'use client';

import { Box, Typography } from '@mui/material';

interface DescriptionTabProps {
  description: string;
  characteristics: { label: string; value: string }[];
}

export function DescriptionTab({ description, characteristics }: DescriptionTabProps) {
  const hasCharacteristics = characteristics.length > 0;
  const hasDescription = !!description;

  if (!hasCharacteristics && !hasDescription) {
    return (
      <Typography
        variant="subtitle1"
        sx={{ color: 'text.muted' }}
      >
        Описание отсутствует
      </Typography>
    );
  }

  return (
    <Box>
      {hasCharacteristics && (
        <>
          <Typography
            variant="h3"
            sx={{ mb: 3 }}
          >
            Характеристики
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 0,
              mb: hasDescription ? 5 : 0,
            }}
          >
            {characteristics.map((row) => (
              <Box
                key={row.label}
                sx={(t) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.5,
                  px: 1,
                  borderBottom: `1px solid ${t.palette.border.light}`,
                  gap: 2,
                })}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: 13, md: 15 },
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 13, md: 15 },
                    fontWeight: 500,
                    color: 'text.primary',
                    textAlign: 'right',
                  }}
                >
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {hasDescription && (
        <>
          <Typography
            variant="h3"
            sx={{ mb: 2 }}
          >
            Описание товара
          </Typography>
          <Box
            sx={{
              fontSize: { xs: 15, md: 17 },
              lineHeight: 1.65,
              color: 'primary.light',
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </>
      )}
    </Box>
  );
}
