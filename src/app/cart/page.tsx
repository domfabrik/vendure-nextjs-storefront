'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Button, Card, CardMedia, Divider, IconButton, Typography } from '@mui/material';
import NextLink from 'next/link';
import { priceFormatter } from '@/lib';
import { useCartStore } from '@/shared/store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const setItemQuantity = useCartStore((s) => s.setItemQuantity);

  if (items.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography
          variant="h5"
          sx={{ mb: 3 }}
        >
          Корзина пуста
        </Typography>
        <Button
          variant="contained"
          component={NextLink}
          href="/"
        >
          Перейти к покупкам
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 700, mb: 3 }}
      >
        Корзина
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
        {/* Cart items */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <Card
              key={item.productVariantId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
              }}
            >
              {item.image && (
                <CardMedia
                  component="img"
                  image={`${item.image}?w=128&h=128&format=webp`}
                  alt={item.productName}
                  sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component={NextLink}
                  href={`/products/${item.slug}`}
                  sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, display: 'block' }}
                  noWrap
                >
                  {item.productName}
                </Typography>
                {item.variantName !== item.productName && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                  >
                    {item.variantName}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {priceFormatter(item.price)} за шт.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (item.quantity <= 1) {
                      removeFromCart(item.productVariantId);
                    } else {
                      setItemQuantity(item.productVariantId, item.quantity - 1);
                    }
                  }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                <IconButton
                  size="small"
                  onClick={() => setItemQuantity(item.productVariantId, item.quantity + 1)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography sx={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{priceFormatter(item.price * item.quantity)}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeFromCart(item.productVariantId)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Card>
          ))}
        </Box>

        {/* Order summary */}
        <Card sx={{ p: 3, width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Итого
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography color="text.secondary">Подытог</Typography>
            <Typography>{priceFormatter(totalPrice)}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
            >
              К оплате
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
            >
              {priceFormatter(totalPrice)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => console.log('checkout', items)}
          >
            Оформить заказ
          </Button>
        </Card>
      </Box>
    </Box>
  );
}
