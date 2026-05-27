'use client';

import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Collapse, Drawer, IconButton, List, ListItemButton, ListItemText, Typography } from '@mui/material';
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
      <ListItemButton
        sx={{ pl: 2 + depth * 2 }}
        onClick={() => {
          if (hasChildren) {
            setOpen((prev) => !prev);
          } else {
            onClose();
          }
        }}
        {...(!hasChildren && {
          component: NextLink,
          href: `/collections/${node.slug}`,
        })}
      >
        <ListItemText primary={node.name} />
        {hasChildren && (open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open}>
          <List disablePadding>
            <ListItemButton
              component={NextLink}
              href={`/collections/${node.slug}`}
              sx={{ pl: 2 + (depth + 1) * 2 }}
              onClick={onClose}
            >
              <ListItemText
                primary="Все товары"
                slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }}
              />
            </ListItemButton>
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
      <IconButton
        color="inherit"
        onClick={() => setOpen(true)}
        aria-label="Каталог"
      >
        <MenuIcon />
      </IconButton>
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
