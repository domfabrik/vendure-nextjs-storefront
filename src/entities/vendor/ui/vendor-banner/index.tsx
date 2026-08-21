'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { routes } from '@routes';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Vendor } from '../../model/vendor';

const BRAND_FACET_ID = '2';

function getVendorSearchHref(vendorId: string) {
  return routes.search({
    filters: JSON.stringify({ [BRAND_FACET_ID]: [vendorId] }),
  });
}

const vendors: Vendor[] = [
  {
    id: '55',
    name: 'Арида',
    code: 'facet-value-45ec38616170',
    description: 'Крупнейший производитель корпусной мебели на юге России — спальни, гостиные, кухни с итальянским дизайном',
    logo: '/images/vendors/arida-logo.svg',
    banner: '/images/vendors/arida-banner.webp',
    invertLogo: false,
  },
  {
    id: '162',
    name: 'Эра',
    code: 'era',
    description: 'Ставропольская фабрика классической мебели — изысканные спальни, гостиные и столовые по лекалам итальянских мастеров',
    logo: '/images/vendors/era-logo.png',
    banner: '/images/vendors/era-banner.jpg',
    invertLogo: true,
  },
  {
    id: '219',
    name: 'Fortuna Home',
    code: 'facet-value-55c870f54c58',
    description: 'Современные спальни, гостиные, кухни и мягкая мебель — более 500 партнёров по всей России',
    logo: '/images/vendors/fortuna-logo.svg',
    banner: '/images/vendors/fortuna-banner.jpg',
    invertLogo: false,
  },
  {
    id: '256',
    name: 'Nartmi company',
    code: 'facet-value-0d0525cce621',
    description: 'Современные диваны-кровати с механизмом трансформации — комфорт и стиль в каждой детали',
    logo: '/images/vendors/nartmi-logo.png',
    banner: '/images/vendors/nartmi-banner.jpg',
    invertLogo: true,
  },
  {
    id: '257',
    name: 'ФСМ',
    code: 'facet-value-02a0236d0fab',
    description: 'Фабрика стильной мебели — диваны, кресла, стулья и столы с безупречным дизайном',
    logo: '/images/vendors/fsm-logo.png',
    banner: '/images/vendors/fsm-banner.jpg',
    invertLogo: false,
  },
];

export function VendorBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (vendors.length === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative', mb: 8 }}>
      <Box
        ref={emblaRef}
        sx={{
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex' }}>
          {vendors.map((vendor) => (
            <Box
              key={vendor.id}
              sx={{
                position: 'relative',
                flex: '0 0 100%',
                minWidth: 0,
                height: { xs: 280, md: 280, lg: 360 },
              }}
            >
              <Image
                src={vendor.banner}
                alt={vendor.name}
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                priority
              />

              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(33, 39, 48, 1) 0%, rgba(33, 39, 48 ,0.6) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: { xs: 3, sm: 5, md: 8 },
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 120, md: 160 },
                    height: { xs: 40, md: 50 },
                  }}
                >
                  <Image
                    src={vendor.logo}
                    alt={`${vendor.name} логотип`}
                    fill
                    sizes="160px"
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'left',
                      filter: vendor.invertLogo ? 'brightness(0) invert(1)' : undefined,
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    color: '#ffffff',
                    maxWidth: '800px',
                    fontWeight: 600,
                    textShadow: '1px 0px 10px black',
                    fontSize: { sm: '14px', md: '26px' },
                  }}
                >
                  {vendor.description}
                </Typography>

                <Box>
                  <Button
                    variant="contained"
                    LinkComponent={NextLink}
                    href={getVendorSearchHref(vendor.id)}
                    sx={{
                      mt: 1,
                      bgcolor: '#ffffff',
                      color: '#1B2B45',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.85)',
                      },
                    }}
                  >
                    Смотреть товары
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Стрелки навигации */}
      <IconButton
        onClick={scrollPrev}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'absolute',
          left: -20,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <IconButton
        onClick={scrollNext}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'absolute',
          right: -20,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        <ChevronRightIcon />
      </IconButton>

      {/* Точки-индикаторы */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        {vendors.map((vendor, index) => (
          <Box
            key={vendor.id}
            onClick={() => scrollTo(index)}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: index === selectedIndex ? 'primary.main' : 'grey.400',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
