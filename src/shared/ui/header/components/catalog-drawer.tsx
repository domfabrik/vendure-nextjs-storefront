'use client';

import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse, Drawer, IconButton, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { useState } from 'react';
import { arrayToTree, type TreeNode } from '@/shared/lib';
import type { CollectionTile } from '@/shared/model';

interface CatalogDrawerProps {
  collections: CollectionTile[];
}

function CategoryItem({ node, onClose, depth = 0 }: { node: TreeNode<CollectionTile>; onClose: () => void; depth?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <>
      {hasChildren ? (
        <ListItemButton
          sx={{ pl: 2 + depth * 2 }}
          onClick={() => setOpen((prev) => !prev)}
        >
          <ListItemText primary={node.name} />
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      ) : (
        <NextLink
          href={routes.collection(node.slug)}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <ListItemButton
            sx={{ pl: 2 + depth * 2 }}
            onClick={onClose}
          >
            <ListItemText primary={node.name} />
          </ListItemButton>
        </NextLink>
      )}
      {hasChildren && (
        <Collapse in={open}>
          <List disablePadding>
            <NextLink
              href={routes.collection(node.slug)}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemButton
                sx={{ pl: 2 + (depth + 1) * 2 }}
                onClick={onClose}
              >
                <ListItemText
                  primary="Все товары"
                  slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }}
                />
              </ListItemButton>
            </NextLink>
            {node.children.map((child) => (
              <CategoryItem
                key={child.id}
                node={child}
                onClose={onClose}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
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
