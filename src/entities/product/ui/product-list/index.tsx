import { Masonry } from '@mui/lab';
import type { HomepageProduct } from '@/shared/model';
import { ProductCard } from '@/shared/ui/product-card';

interface Props {
  products: HomepageProduct[];
}

export function ProductList({ products }: Props) {
  return (
    <Masonry
      columns={{ xs: 1, sm: 1, md: 3, lg: 4, xl: 6, xxl: 6 }}
      spacing={3}
      sx={{ width: 'auto', minWidth: '100%' }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          imgHeight="auto"
        />
      ))}
    </Masonry>
  );
}
