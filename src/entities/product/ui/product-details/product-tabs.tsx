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
        sx={{
          display: 'flex',
          gap: { xs: 2, md: 4 },
          borderBottom: '1px solid #E6E2DB',
          mb: 4,
        }}
      >
        {tabs.map((tab) => (
          <Box
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            sx={{
              pb: 1.5,
              cursor: 'pointer',
              fontSize: { xs: 13, md: 16 },
              fontWeight: 600,
              color: activeTab === tab.key ? '#1B2B45' : '#6B7586',
              borderBottom: activeTab === tab.key ? '3px solid #1B2B45' : '3px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { color: '#1B2B45' },
              userSelect: 'none',
            }}
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
    return <Typography sx={{ color: '#6B7586', fontSize: 17 }}>Описание отсутствует</Typography>;
  }

  return (
    <Box>
      <Typography
        variant="h2"
        sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, mb: 2, color: '#1B2B45' }}
      >
        Описание товара
      </Typography>
      <Box
        sx={{
          fontSize: { xs: 15, md: 17 },
          lineHeight: 1.65,
          color: '#343E50',
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
    return <Typography sx={{ color: '#6B7586', fontSize: 17 }}>Характеристики не указаны</Typography>;
  }

  return (
    <Box>
      <Typography
        variant="h2"
        sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 800, mb: 3, color: '#1B2B45' }}
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
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1.5,
              px: 1,
              borderBottom: '1px solid #EFEBE5',
              gap: 2,
            }}
          >
            <Typography
              sx={{
                color: '#5A6475',
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
                color: '#1B2B45',
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
      icon: <LocalShippingOutlined sx={{ fontSize: 28, color: '#1B2B45' }} />,
      title: 'Доставка',
      text: 'Доставка по Туле — бесплатно. Доставка по России транспортными компаниями СДЭК, Деловые Линии, ПЭК. Стоимость рассчитывается индивидуально.',
    },
    {
      icon: <PaymentOutlined sx={{ fontSize: 28, color: '#1B2B45' }} />,
      title: 'Оплата',
      text: 'Наличные, банковская карта, безналичный расчёт. Предоплата 100%',
    },
    {
      icon: <StorefrontOutlined sx={{ fontSize: 28, color: '#1B2B45' }} />,
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
            bgcolor: '#F5F2EC',
            borderRadius: '16px',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {card.icon}
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1B2B45' }}>{card.title}</Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: '#343E50' }}>{card.text}</Typography>
        </Box>
      ))}
    </Box>
  );
}
