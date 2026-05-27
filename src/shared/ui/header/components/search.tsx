'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, CircularProgress, InputAdornment, Paper, type PaperProps, TextField, Typography } from '@mui/material';
import { routes } from '@routes';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchResult } from '@/shared/api/products';
import { searchProducts } from '@/shared/api/search';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const stateRef = useRef({ query: '', totalItems: 0 });
  stateRef.current = { query, totalItems };

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      setTotalItems(0);
      return;
    }

    let cancelled = false;
    setLoading(true);

    searchProducts({ term: debouncedQuery, take: 6, sort: { price: 'DESC' } })
      .then((res) => {
        if (cancelled) return;
        setResults(res.items);
        setTotalItems(res.totalItems);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setTotalItems(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const SearchPaper = useCallback(
    (props: PaperProps) => (
      <Paper {...props}>
        {props.children}
        {stateRef.current.totalItems > 0 && (
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Link
              href={routes.search(stateRef.current.query)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                color: 'inherit',
                fontSize: 14,
              }}
            >
              Все результаты ({stateRef.current.totalItems})
              <ArrowForwardIcon fontSize="small" />
            </Link>
          </Box>
        )}
      </Paper>
    ),
    [],
  );

  return (
    <Autocomplete
      freeSolo
      open={query.length >= 3}
      options={results}
      inputValue={query}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') setQuery(value);
      }}
      filterOptions={(x) => x}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.productName)}
      loading={loading}
      loadingText="Загрузка..."
      noOptionsText="Ничего не найдено"
      renderOption={(props, option) => (
        <li
          {...props}
          key={option.slug}
        >
          <Link
            href={routes.product(option.slug)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {option.productAsset?.preview && (
              <Box
                component="img"
                src={`${option.productAsset.preview}?w=80&h=80&format=webp`}
                alt={option.productName}
                sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
              />
            )}
            <Typography variant="body2">{option.productName}</Typography>
          </Link>
        </li>
      )}
      slots={{ paper: SearchPaper }}
      popupIcon={null}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Поиск товаров..."
          size="small"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: loading ? <CircularProgress size={18} /> : null,
            },
          }}
        />
      )}
      sx={{
        flex: 1,
        maxWidth: '400px',
      }}
    />
  );
}
