'use server';

import { Box, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { arrayToTree } from '@/shared/lib';
import type { CollectionTile } from '@/shared/model';

interface CategoryNavProps {
  collections: CollectionTile[];
}

export async function CategoryNav({ collections }: CategoryNavProps) {
  const tree = arrayToTree(collections);
  const topLevel = tree.children;

  return (
    <Box
      sx={{
        maxWidth: 1280,
        mx: 'auto',
        px: { xs: 1, sm: 4 },
        pb: 1.5,
        display: 'flex',
        gap: '28px',
        fontSize: 15,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflowX: 'auto',
      }}
    >
      {topLevel.map((node) => (
        <NextLink
          key={node.id}
          href={routes.collection(node.slug)}
          style={{ textDecoration: 'none' }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: 'text.primary', '&:hover': { color: 'accent.main' } }}
          >
            {node.name}
          </Typography>
        </NextLink>
      ))}
    </Box>
  );
}
