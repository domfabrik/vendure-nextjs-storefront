'use client';

import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Typography,
} from '@mui/material';
import { routes } from '@routes';
import NextLink from 'next/link';
import { useQueryStates } from 'nuqs';
import { useState, useTransition } from 'react';
import type { Facet, SearchFacetValue, SearchResponse, SearchResult } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';
import { PER_PAGE, searchParsers } from './search-params';

interface FacetGroup extends Facet {
  values: (Facet & { count: number; facet: Facet })[];
}

function reduceFacets(allFacetValues: SearchFacetValue[], filteredFacetValues: SearchFacetValue[]): FacetGroup[] {
  const countMap = new Map(filteredFacetValues.map((fv) => [fv.facetValue.id, fv.count]));

  return allFacetValues.reduce<FacetGroup[]>((acc, curr) => {
    const facet = curr.facetValue.facet;
    const facetValue = { ...curr.facetValue, count: countMap.get(curr.facetValue.id) ?? 0 };
    const group = acc.find((f) => f.id === facet.id);
    if (group) {
      group.values.push(facetValue);
    } else {
      acc.push({ id: facet.id, name: facet.name, code: facet.code, values: [facetValue] });
    }
    return acc;
  }, []);
}

const sortOptions = [
  { label: 'По названию А-Я', value: 'name-ASC' },
  { label: 'По названию Я-А', value: 'name-DESC' },
  { label: 'Сначала дешёвые', value: 'price-ASC' },
  { label: 'Сначала дорогие', value: 'price-DESC' },
];

interface SearchPageProps {
  initialData: SearchResponse | null;
  allFacetValues: SearchFacetValue[];
}

export function SearchPage({ initialData, allFacetValues }: SearchPageProps) {
  const [isPending, startTransition] = useTransition();
  const [searchState, setSearchState] = useQueryStates(searchParsers, { shallow: false, startTransition });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { q, page, sort, filters } = searchState;

  const products: SearchResult[] = initialData?.items ?? [];
  const totalItems = initialData?.totalItems ?? 0;
  const facetGroups: FacetGroup[] = allFacetValues.length > 0 ? reduceFacets(allFacetValues, initialData?.facetValues ?? []) : [];
  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const handlePageChange = (_: unknown, newPage: number) => {
    setSearchState({ page: newPage > 1 ? newPage : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    setSearchState({ sort: value, page: null });
  };

  const toggleFilter = (groupId: string, valueId: string) => {
    const current = filters[groupId] ?? [];
    const next = current.includes(valueId) ? current.filter((id) => id !== valueId) : [...current, valueId];
    const updated = { ...filters, [groupId]: next };
    if (next.length === 0) delete updated[groupId];
    const hasFilters = Object.keys(updated).length > 0;
    setSearchState({ filters: hasFilters ? updated : null, page: null });
  };

  const clearFilters = () => {
    setSearchState({ filters: null, page: null });
  };

  const activeFilterCount = Object.values(filters).reduce((sum, ids) => sum + ids.length, 0);

  const filtersContent = (
    <Box sx={{ p: 2, width: 280 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600 }}
        >
          Фильтры
        </Typography>
        <IconButton
          onClick={() => setFiltersOpen(false)}
          size="small"
          aria-label="Закрыть фильтры"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {facetGroups.map((group) => (
        <Box
          key={group.id}
          sx={{ mb: 2 }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 0.5 }}
          >
            {group.name}
          </Typography>
          <FormGroup>
            {group.values.map((value) => (
              <FormControlLabel
                key={value.id}
                control={
                  <Checkbox
                    size="small"
                    checked={filters[group.id]?.includes(value.id) ?? false}
                    onChange={() => toggleFilter(group.id, value.id)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {value.name} ({value.count})
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <NextLink href={routes.home()}>Главная</NextLink>
        <Typography color="text.primary">Поиск</Typography>
      </Breadcrumbs>

      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 700, mb: 1 }}
      >
        Результаты поиска {q && `«${q}»`}
      </Typography>

      {!isPending && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Найдено: {totalItems}
        </Typography>
      )}

      {/* Toolbar: filters + sort */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setFiltersOpen(true)}
        >
          Фильтры{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
        <Select
          size="small"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {sortOptions.map((opt) => (
            <MenuItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {facetGroups.flatMap((group) =>
            (filters[group.id] ?? []).map((valueId) => {
              const fv = group.values.find((v) => v.id === valueId);
              if (!fv) return null;
              return (
                <Chip
                  key={valueId}
                  label={`${group.name}: ${fv.name}`}
                  size="small"
                  onDelete={() => toggleFilter(group.id, valueId)}
                />
              );
            }),
          )}
          <Chip
            label="Сбросить все"
            size="small"
            variant="outlined"
            onClick={clearFilters}
          />
        </Box>
      )}

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {filtersContent}
      </Drawer>

      {/* Products */}
      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography
            variant="h6"
            color="text.secondary"
          >
            Ничего не найдено
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 2,
            }}
          >
            {products.map((p) => (
              <ProductCard
                key={p.slug}
                product={{
                  productName: p.productName,
                  slug: p.slug,
                  productVariantId: p.productVariantId,
                  currencyCode: p.currencyCode,
                  discountPercent: p.discountPercent,
                  basePriceWithTax: p.basePriceWithTax,
                  priceWithTax: p.priceWithTax,
                  productAsset: p.productAsset,
                }}
              />
            ))}
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
