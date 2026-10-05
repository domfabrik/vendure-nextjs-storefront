'use client';

import { Box, Typography } from '@mui/material';
import type { CatalogStockState } from '@/shared/lib';

interface EnrichedOption {
  name: string;
  id: string;
  code: string;
  stock: CatalogStockState;
  isSelected: boolean;
  preview: string | null;
}

interface EnrichedGroup {
  id: string;
  name: string;
  options: EnrichedOption[];
}

interface VariantSelectorProps {
  groups: EnrichedGroup[];
  onSelect: (groupId: string, optionId: string) => void;
}

export function VariantSelector({ groups, onSelect }: VariantSelectorProps) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <Box key={group.id}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#5A6475', mb: 1.5 }}>{group.name}</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
            }}
          >
            {group.options.map((option) => (
              <Box
                key={option.id}
                onClick={() => onSelect(group.id, option.id)}
                sx={{
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: option.isSelected ? '#1B2B45' : '#E6E2DB',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  opacity: option.stock.kind === 'out-of-stock' ? 0.5 : 1,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: option.isSelected ? '#1B2B45' : '#A8A29E' },
                }}
              >
                {option.preview && (
                  <Box
                    sx={{
                      aspectRatio: '4 / 3',
                      bgcolor: '#F3F1EE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                    }}
                  >
                    <img
                      src={option.preview}
                      alt={option.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        mixBlendMode: 'multiply',
                      }}
                    />
                  </Box>
                )}
                <Typography
                  sx={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: option.isSelected ? 600 : 400,
                    color: '#1B2B45',
                    py: 0.75,
                    px: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {option.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}
