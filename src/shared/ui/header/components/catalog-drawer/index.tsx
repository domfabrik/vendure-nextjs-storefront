'use client';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Drawer, IconButton, List, Typography } from '@mui/material';
import { useState } from 'react';
import { arrayToTree } from '@/shared/lib';
import type { CollectionTile } from '@/shared/model';
import { CategoryItem } from './category-item';

interface CatalogDrawerProps {
  collections: CollectionTile[];
}

export function CatalogDrawer({ collections }: CatalogDrawerProps) {
  const [open, setOpen] = useState(false);
  const tree = arrayToTree(collections);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        aria-label="Каталог"
        data-testid="catalog-menu"
        sx={{ px: { xs: 1.5, sm: 2.25 }, flexShrink: 0, minWidth: 'auto', gap: 1 }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
        <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Каталог</Box>
      </Button>
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ width: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
            >
              Каталог
            </Typography>
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              aria-label="Закрыть каталог"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <List disablePadding>
            {tree.children.map((node) => (
              <CategoryItem
                key={node.id}
                node={node}
                onClose={() => setOpen(false)}
              />
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
