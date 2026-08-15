import { Masonry } from '@mui/lab';
import { HomepageCollection } from '@/shared/model';
import { CollectionCard } from '../collection-card';

interface Props {
  collections: HomepageCollection[];
}

export function CollectionList({ collections }: Props) {
  return (
    <Masonry
      columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6, xxl: 6 }}
      spacing={3}
      sx={{ width: 'auto', minWidth: '100%' }}
    >
      {collections.map((collection) => (
        <CollectionCard
          key={collection.slug}
          collection={collection}
        />
      ))}
    </Masonry>
  );
}
