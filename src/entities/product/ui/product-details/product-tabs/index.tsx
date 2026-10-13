'use client';

import { Box } from '@mui/material';
import { useState } from 'react';
import type { ProductCustomFields, ProductVariantCustomFields } from '@/shared/api';
import { buildFlatCharacteristics } from '../../../lib/characteristics';
import { DeliveryTab } from './delivery-tab';
import { DescriptionTab } from './description-tab';

interface ProductTabsProps {
  description: string;
  productCustomFields: ProductCustomFields;
  variantCustomFields: ProductVariantCustomFields | null;
}

type TabKey = 'description' | 'delivery';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'description', label: 'Описание' },
  { key: 'delivery', label: 'Доставка и оплата' },
];

export function ProductTabs({ description, productCustomFields, variantCustomFields }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const characteristics = buildFlatCharacteristics(productCustomFields, variantCustomFields);

  return (
    <Box sx={{ mt: 6 }}>
      {/* Tab navigation */}
      <Box
        sx={(t) => ({
          display: 'flex',
          gap: { xs: 2, md: 4 },
          borderBottom: `1px solid ${t.palette.border.main}`,
          mb: 4,
        })}
      >
        {tabs.map((tab) => (
          <Box
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            sx={(t) => ({
              pb: 1.5,
              cursor: 'pointer',
              fontSize: { xs: 13, md: 16 },
              fontWeight: 600,
              color: activeTab === tab.key ? t.palette.text.primary : t.palette.text.muted,
              borderBottom: activeTab === tab.key ? `3px solid ${t.palette.primary.main}` : '3px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { color: t.palette.text.primary },
              userSelect: 'none',
            })}
          >
            {tab.label}
          </Box>
        ))}
      </Box>

      {/* Tab content */}
      {activeTab === 'description' && (
        <DescriptionTab
          description={description}
          characteristics={characteristics}
        />
      )}
      {activeTab === 'delivery' && <DeliveryTab />}
    </Box>
  );
}
