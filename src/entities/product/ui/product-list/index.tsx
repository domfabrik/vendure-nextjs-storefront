import { Box } from '@mui/material';
import type { HomepageProduct } from '@/shared/model';
import { ProductCard } from '@/shared/ui/product-card';

interface Props {
  products: HomepageProduct[];
}

export function ProductList({ products }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 2.5,
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
        />
      ))}
    </Box>
  );
}
