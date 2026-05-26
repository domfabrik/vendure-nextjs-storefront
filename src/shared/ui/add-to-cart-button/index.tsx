'use client';

import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Button } from '@mui/material';
import { useCartStore } from '@/shared/store/cart';

interface AddToCartButtonProps {
  variantId: string;
  productName: string;
  variantName: string;
  slug: string;
  price: number;
  image: string | null;
  disabled?: boolean;
}

export function AddToCartButton({ variantId, productName, variantName, slug, price, image, disabled }: AddToCartButtonProps) {
  const addToCart = useCartStore((s) => s.addToCart);

  const handleClick = () => {
    addToCart({
      productVariantId: variantId,
      productName,
      variantName,
      slug,
      price,
      image,
    });
  };

  return (
    <Button
      variant="contained"
      size="large"
      disabled={disabled}
      onClick={handleClick}
      startIcon={<ShoppingCartIcon />}
    >
      В корзину
    </Button>
  );
}
