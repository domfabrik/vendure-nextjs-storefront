import { Box, Card, CardContent, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { HomepageCollection } from '@/shared/model';

interface Props {
  collection: HomepageCollection;
}

export function CollectionCard(props: Props) {
  const product = props.collection.products[0];

  if (!product) {
    return undefined;
  }

  const image = product.productAsset?.preview;

  return (
    <NextLink href={routes.collection(props.collection.slug)}>
      <Card
        elevation={3}
        sx={{
          textAlign: 'center',
          borderRadius: 2,
          '&:hover': {
            img: {
              transform: 'scale(1.1)',
            },
          },
        }}
      >
        <Box sx={{ overflow: 'hidden' }}>
          <Box
            component="img"
            src={image}
            alt={product.productName}
            sx={{
              display: 'block',
              width: '100%',
              height: 'auto',
              transition: 'transform .5s',
            }}
          />
        </Box>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 300 }}
          >
            {props.collection.name}
          </Typography>
        </CardContent>
      </Card>
    </NextLink>
  );
}
