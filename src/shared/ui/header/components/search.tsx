'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Box, CircularProgress, InputAdornment, Paper, type PaperProps, TextField, Typography } from '@mui/material';
import { routes } from '@routes';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { searchProducts } from '@/shared/api/search';
import type { SearchResult } from '@/shared/model';
import { buildHeaderSearchInput } from './search-input';

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
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

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

    searchProducts(buildHeaderSearchInput(debouncedQuery))
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

  const navigateToSearch = () => {
    const q = stateRef.current.query.trim();
    if (q.length >= 3) {
      setOpen(false);
      router.push(routes.search(q));
    }
  };

  const SearchPaper = (props: PaperProps) => (
    <Paper {...props}>
      {props.children}
      {stateRef.current.totalItems > 0 && (
        <Box
          sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
          onMouseDown={(e) => e.preventDefault()}
        >
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
  );

  return (
    <Autocomplete
      freeSolo
      open={open && query.length >= 3}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={results}
      inputValue={query}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') {
          setQuery(value);
          if (value.length >= 3) setOpen(true);
        }
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
              <img
                src={`${option.productAsset.preview}?w=80&h=80&format=webp`}
                alt={option.productName}
                style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
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
          placeholder="Кровать, диван, кухня…"
          size="small"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              navigateToSearch();
            }
          }}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: '#5A6475' }}
                  />
                </InputAdornment>
              ),
              endAdornment: loading ? <CircularProgress size={18} /> : null,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 46,
              borderRadius: '10px',
              bgcolor: '#FAF9F7',
              '& fieldset': {
                borderWidth: '1.5px',
                borderColor: '#D9D4CC',
              },
              '&:hover fieldset': {
                borderColor: '#1B2B45',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1B2B45',
              },
            },
          }}
        />
      )}
      sx={{
        flex: 1,
        order: { xs: 3, md: 0 },
        flexBasis: { xs: '100%', md: 'auto' },
      }}
    />
  );
}
