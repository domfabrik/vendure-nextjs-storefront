import { Stack, TH2 } from '@/src/components/atoms';
import { ProductVariantTile } from '@/src/components/molecules/ProductVariantTile';

import { Slider } from '@/src/components/organisms/Slider';
import { ProductVariantTileType } from '@/src/graphql/selectors';

interface ProductPageProductsSliderProps {
  title: string;
  products: ProductVariantTileType[];
}

export const ProductPageProductsSlider = ({ products, title }: ProductPageProductsSliderProps) => {
  if (!products?.length) return null;
  const slides = products.map((variant, index) => (
    <ProductVariantTile
      lazy
      key={index}
      variant={variant}
    />
  ));

  return (
    <Stack
      column
      gap="2rem"
      style={{ marginBottom: '2rem' }}
    >
      <TH2>{title}</TH2>
      <Slider
        withArrows={4}
        spacing={32}
        slides={slides}
      />
    </Stack>
  );
};
