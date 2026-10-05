'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { priceFormatter } from '@/shared/lib';

interface PriceBlockProps {
  price: number;
  currency: 'RUB';
  basePrice?: number;
  savings: number;
  hasDiscount: boolean;
  discountPercent?: number;
  purchasable: boolean;
  inCart: boolean;
  cartQuantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}

export function PriceBlock({ price, currency, basePrice, savings, hasDiscount, discountPercent, purchasable, inCart, cartQuantity, onAdd, onChangeQuantity }: PriceBlockProps) {
  return (
    <Box
      sx={(t) => ({
        border: `1px solid ${t.palette.border.main}`,
        borderRadius: '16px',
        p: 3,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{priceFormatter(price, currency)}</Typography>
      </Box>
      {hasDiscount && basePrice !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: 'text.hint', textDecoration: 'line-through' }}
          >
            {priceFormatter(basePrice, currency)}
          </Typography>
          {typeof discountPercent === 'number' && discountPercent > 0 && (
            <Typography
              variant="overline"
              sx={{
                bgcolor: 'accent.light',
                color: 'accent.dark',
                fontWeight: 600,
                px: 1,
                py: 0.5,
                borderRadius: '6px',
              }}
            >
              -{discountPercent}%
            </Typography>
          )}
          {savings > 0 && (
            <Typography
              variant="overline"
              sx={{
                bgcolor: 'accent.light',
                color: 'accent.dark',
                fontWeight: 600,
                px: 1,
                py: 0.5,
                borderRadius: '6px',
              }}
            >
              Экономия {priceFormatter(savings, currency)}
            </Typography>
          )}
        </Box>
      )}
      {!hasDiscount && <Box sx={{ mb: 2 }} />}

      {purchasable && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
          {inCart ? (
            <>
              <Box
                sx={(t) => ({
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  border: `1px solid ${t.palette.border.main}`,
                  borderRadius: '12px',
                })}
              >
                <IconButton
                  onClick={() => onChangeQuantity(cartQuantity - 1)}
                  sx={{ borderRadius: 0, px: 1.5, color: 'primary.main' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{cartQuantity}</Typography>
                <IconButton
                  onClick={onAdd}
                  sx={{ borderRadius: 0, px: 1.5, color: 'primary.main' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                fullWidth
                disabled
                startIcon={<ShoppingCartIcon />}
                sx={{
                  bgcolor: 'primary.main',
                  height: 54,
                  borderRadius: '12px',
                  fontSize: 16,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-disabled': { bgcolor: 'primary.main', color: 'rgba(255,255,255,0.7)' },
                }}
              >
                В корзине
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={onAdd}
              data-testid="add-to-cart"
              startIcon={<ShoppingCartIcon />}
              sx={{
                bgcolor: 'primary.main',
                height: 54,
                borderRadius: '12px',
                fontSize: 16,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              В корзину
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
