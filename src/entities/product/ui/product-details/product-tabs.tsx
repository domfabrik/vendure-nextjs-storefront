'use client';

import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlined from '@mui/icons-material/PaymentOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import type { ProductCustomFields, ProductVariantCustomFields } from '@/shared/api';
import { contacts } from '@/shared/router';
import { buildFlatCharacteristics } from '../../lib/characteristics';

interface ProductTabsProps {
  description: string;
  productCustomFields: ProductCustomFields;
  variantCustomFields: ProductVariantCustomFields | null;
}

type TabKey = 'description' | 'characteristics' | 'delivery';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'description', label: 'Описание' },
  { key: 'characteristics', label: 'Характеристики' },
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
      {activeTab === 'description' && <DescriptionTab description={description} />}
      {activeTab === 'characteristics' && <CharacteristicsTab rows={characteristics} />}
      {activeTab === 'delivery' && <DeliveryTab />}
    </Box>
  );
}

function DescriptionTab({ description }: { description: string }) {
  if (!description) {
    return (
      <Typography
        variant="subtitle1"
        sx={{ color: 'text.muted' }}
      >
        Описание отсутствует
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        variant="h3"
        sx={{ mb: 2 }}
      >
        Описание товара
      </Typography>
      <Box
        sx={{
          fontSize: { xs: 15, md: 17 },
          lineHeight: 1.65,
          color: 'primary.light',
          '& p': { mb: 1.5 },
          '& ul, & ol': { pl: 3, mb: 1.5 },
        }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </Box>
  );
}

function CharacteristicsTab({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) {
    return (
      <Typography
        variant="subtitle1"
        sx={{ color: 'text.muted' }}
      >
        Характеристики не указаны
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        variant="h3"
        sx={{ mb: 3 }}
      >
        Характеристики
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 0,
        }}
      >
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={(t) => ({
              display: 'flex',
              justifyContent: 'space-between',
              py: 1.5,
              px: 1,
              borderBottom: `1px solid ${t.palette.border.light}`,
              gap: 2,
            })}
          >
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: 13, md: 15 },
                flexShrink: 0,
              }}
            >
              {row.label}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 13, md: 15 },
                fontWeight: 500,
                color: 'text.primary',
                textAlign: 'right',
              }}
            >
              {row.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DeliveryTab() {
  const cards = [
    {
      icon: <LocalShippingOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Доставка',
      text: 'Доставка по Туле — бесплатно. Доставка по России транспортными компаниями СДЭК, Деловые Линии, ПЭК. Стоимость рассчитывается индивидуально.',
    },
    {
      icon: <PaymentOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Оплата',
      text: 'Наличные, банковская карта, безналичный расчёт. Предоплата 100%',
    },
    {
      icon: <StorefrontOutlined sx={{ fontSize: 28, color: 'text.primary' }} />,
      title: 'Шоурум в Туле',
      text: `${contacts.address}. ${contacts.workingHours}. Тел: ${contacts.phone}`,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
        gap: 2.5,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.title}
          sx={{
            bgcolor: 'warmBg',
            borderRadius: '16px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {card.icon}
          <Typography variant="h6">{card.title}</Typography>
          <Typography
            variant="subtitle1"
            sx={{ lineHeight: 1.6, color: 'primary.light' }}
          >
            {card.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
