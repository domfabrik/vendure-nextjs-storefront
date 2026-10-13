'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { useState } from 'react';
import type { TreeNode } from '@/shared/lib';
import type { CollectionTile } from '@/shared/model';

interface CategoryItemProps {
  node: TreeNode<CollectionTile>;
  onClose: () => void;
  depth?: number;
}

export function CategoryItem({ node, onClose, depth = 0 }: CategoryItemProps) {
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
