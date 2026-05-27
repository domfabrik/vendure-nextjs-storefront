'use client';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { routes } from '@routes';
import { useRouter } from 'next/navigation';
import type { CollectionTile } from '@/shared/api/collections';

interface CollectionSelectorProps {
  collections: CollectionTile[];
  value?: string;
  label?: string;
}

export function CollectionSelector({ collections, value = '' }: CollectionSelectorProps) {
  const router = useRouter();

  return (
    <FormControl
      size="small"
      sx={{ minWidth: 200 }}
    >
      <InputLabel>Категории</InputLabel>
      <Select
        value={value}
        label="Категории"
        autoWidth
        onChange={(e) => {
          const slug = e.target.value as string;
          if (slug) {
            router.push(routes.collection(slug));
          }
        }}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        }}
      >
        {collections.map((collection) => (
          <MenuItem
            key={collection.slug}
            value={collection.slug}
          >
            {collection.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
