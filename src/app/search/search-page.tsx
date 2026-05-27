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
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SearchResult } from '@/shared/api';
import { type Facet, type SearchFacetValue, searchProducts } from '@/shared/api';
import { ProductCard } from '@/shared/ui/product-card';

const PER_PAGE = 24;

type Sort = { key: 'name' | 'price'; direction: 'ASC' | 'DESC' };

interface FacetGroup extends Facet {
  values: (Facet & { count: number; facet: Facet })[];
}

function reduceFacets(facetValues: SearchFacetValue[]): FacetGroup[] {
  return facetValues.reduce<FacetGroup[]>((acc, curr) => {
    const facet = curr.facetValue.facet;
    const facetValue = { ...curr.facetValue, count: curr.count };
    const group = acc.find((f) => f.id === facet.id);
    if (group) {
      group.values.push(facetValue);
    } else {
      acc.push({ id: facet.id, name: facet.name, code: facet.code, values: [facetValue] });
    }
    return acc;
  }, []);
}

function buildFacetValueFilters(filters: Record<string, string[]>) {
  return Object.values(filters)
    .filter((ids) => ids.length > 0)
    .map((ids) => (ids.length === 1 ? { and: ids[0] } : { or: ids }));
}

const sortOptions: { label: string; value: string; sort: Sort }[] = [
  { label: 'По названию А-Я', value: 'name-ASC', sort: { key: 'name', direction: 'ASC' } },
  { label: 'По названию Я-А', value: 'name-DESC', sort: { key: 'name', direction: 'DESC' } },
  { label: 'Сначала дешёвые', value: 'price-ASC', sort: { key: 'price', direction: 'ASC' } },
  { label: 'Сначала дорогие', value: 'price-DESC', sort: { key: 'price', direction: 'DESC' } },
];

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams?.get('q') ?? '';
  const pageParam = parseInt(searchParams?.get('page') ?? '1', 10) || 1;
  const sortParam = searchParams?.get('sort') ?? 'name-ASC';

  const currentSort = useMemo(() => {
    const found = sortOptions.find((o) => o.value === sortParam);
    return found?.sort ?? sortOptions[0].sort;
  }, [sortParam]);

  const [products, setProducts] = useState<SearchResult[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [facetGroups, setFacetGroups] = useState<FacetGroup[]>([]);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const fetchProducts = useCallback(
    async (page: number, sort: Sort, activeFilters: Record<string, string[]>) => {
      setLoading(true);
      try {
        const res = await searchProducts({
          term: q,
          take: PER_PAGE,
          skip: (page - 1) * PER_PAGE,
          sort: sort.key === 'name' ? { name: sort.direction } : { price: sort.direction },
          facetValueFilters: buildFacetValueFilters(activeFilters),
        });
        setProducts(res.items);
        setTotalItems(res.totalItems);
        setFacetGroups(reduceFacets(res.facetValues));
      } catch (e) {
        console.error(e);
        setProducts([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => {
    setFilters({});
  }, [q]);

  useEffect(() => {
    fetchProducts(pageParam, currentSort, filters);
  }, [fetchProducts, pageParam, currentSort, filters]);

  const updateUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(routes.search(params.toString()));
  };

  const handlePageChange = (_: unknown, page: number) => {
    updateUrl({ page: page > 1 ? String(page) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    updateUrl({ sort: value, page: '' });
  };

  const toggleFilter = (groupId: string, valueId: string) => {
    setFilters((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(valueId) ? current.filter((id) => id !== valueId) : [...current, valueId];
      const updated = { ...prev, [groupId]: next };
      if (next.length === 0) delete updated[groupId];
      return updated;
    });
    updateUrl({ page: '' });
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

      {!loading && (
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
          value={sortParam}
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
            onClick={() => {
              setFilters({});
              updateUrl({ page: '' });
            }}
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
      {loading ? (
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
                page={pageParam}
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
