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
  purchasable: boolean;
  inCart: boolean;
  cartQuantity: number;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}

export function PriceBlock({ price, currency, basePrice, savings, hasDiscount, purchasable, inCart, cartQuantity, onAdd, onChangeQuantity }: PriceBlockProps) {
  return (
    <Box
      sx={{
        border: '1px solid #E6E2DB',
        borderRadius: '16px',
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: '#1B2B45', lineHeight: 1 }}>{priceFormatter(price, currency)}</Typography>
      </Box>
      {hasDiscount && basePrice !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 18, color: '#8B9099', textDecoration: 'line-through' }}>{priceFormatter(basePrice, currency)}</Typography>
          {savings > 0 && (
            <Typography
              sx={{
                bgcolor: '#F6ECE3',
                color: '#7A4520',
                fontSize: 13,
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
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  border: '1px solid #E6E2DB',
                  borderRadius: '12px',
                }}
              >
                <IconButton
                  onClick={() => onChangeQuantity(cartQuantity - 1)}
                  sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{cartQuantity}</Typography>
                <IconButton
                  onClick={onAdd}
                  sx={{ borderRadius: 0, px: 1.5, color: '#1B2B45' }}
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
                  bgcolor: '#1B2B45',
                  height: 54,
                  borderRadius: '12px',
                  fontSize: 16,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-disabled': { bgcolor: '#1B2B45', color: 'rgba(255,255,255,0.7)' },
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
              startIcon={<ShoppingCartIcon />}
              sx={{
                bgcolor: '#1B2B45',
                height: 54,
                borderRadius: '12px',
                fontSize: 16,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#152236' },
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
