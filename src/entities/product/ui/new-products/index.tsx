import { Box } from '@mui/material';
import { HomepageProduct } from '@/shared/model';
import { ProductCard } from '@/shared/ui/product-card';

interface Props {
  products: HomepageProduct[];
}

export function NewProducts({ products }: Props) {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        pb: 2,
        mb: 4,
        scrollSnapType: 'x mandatory',
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${products.length}, 1fr)`,
          gap: 3,
          width: {
            xs: `calc((100% / 2) * ${products.length})`,
            sm: `calc((100% / 3) * ${products.length})`,
            md: `calc((100% / 3) * ${products.length})`,
            lg: `calc((100% / 4) * ${products.length})`,
            xl: `calc((100% / 6) * ${products.length})`,
          },
        }}
      >
        {products.map((product) => (
          <Box
            key={product.slug}
            sx={{ scrollSnapAlign: 'start' }}
          >
            <ProductCard product={product} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
