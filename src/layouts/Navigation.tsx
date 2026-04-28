import styled from '@emotion/styled';
import { SearchIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { LogoAexol } from '@/src/assets';
import { ContentContainer } from '@/src/components/atoms';
import { Link } from '@/src/components/atoms/Link';
import { Stack } from '@/src/components/atoms/Stack';
import { IconButton } from '@/src/components/molecules/Button';
import { UserMenu } from '@/src/components/molecules/UserMenu';
import { AnnouncementBar } from '@/src/components/organisms/AnnouncementBar';
import { DesktopNavigation } from '@/src/components/organisms/DesktopNavigation';
import { NavigationSearch } from '@/src/components/organisms/NavgationSearch';
import { useNavigationSearch } from '@/src/components/organisms/NavgationSearch/hooks';
import { CollectionTileType, NavigationType } from '@/src/graphql/selectors';
import { CartDrawer } from '@/src/layouts/CartDrawer';
import { useCart } from '@/src/state/cart';
import { RootNode } from '@/src/util/arrayToTree';
import { CategoryBar } from './CategoryBar';

interface NavigationProps {
  navigation: RootNode<NavigationType> | null;
  categories: CollectionTileType[];
}

export const Navigation = ({ navigation, categories }: NavigationProps) => {
  const { isLogged, cart } = useCart();
  const navigationSearch = useNavigationSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target as Node) &&
      iconRef.current &&
      !iconRef.current.contains(event.target as Node) &&
      searchMobileRef.current &&
      !searchMobileRef.current.contains(event.target as Node)
    ) {
      navigationSearch.closeSearch();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // THIS SHOULD COME FROM PLUGIN
  const announcementsBar = ['ЛУЧШИЕ ТОВАРЫ', 'БЕСПЛАТНАЯ ДОСТАВКА ОТ 5000 ₽', 'БЕЗОПАСНАЯ ОПЛАТА', 'ВОЗВРАТ В ТЕЧЕНИЕ 30 ДНЕЙ'] as string[];
  const entries = [
    { text: announcementsBar[0], href: '/collections/home-garden' },
    { text: announcementsBar[1], href: '/' },
    { text: announcementsBar[2], href: '/' },
    { text: announcementsBar[3], href: '/' },
  ];

  return (
    <>
      <AnnouncementBar
        entries={entries}
        secondsBetween={5}
      />
      <StickyContainer>
        <ContentContainer>
          <Stack
            itemsCenter
            justifyBetween
            gap="5rem"
            w100
          >
            <Stack itemsCenter>
              <Link
                ariaLabel={'Home'}
                href={'/'}
              >
                <LogoAexol width={60} />
              </Link>
            </Stack>
            <AnimatePresence>
              {navigationSearch.searchOpen ? (
                <DesktopNavigationContainer
                  style={{ width: '100%' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  ref={searchRef}
                >
                  <NavigationSearch {...navigationSearch} />
                </DesktopNavigationContainer>
              ) : (
                <DesktopNavigation navigation={navigation} />
              )}
            </AnimatePresence>
            <Stack
              gap="1rem"
              itemsCenter
            >
              <IconButton
                aria-label="Search products"
                onClick={navigationSearch.toggleSearch}
                ref={iconRef}
              >
                <SearchIcon />
              </IconButton>
              <UserMenu isLogged={isLogged} />
              <CartDrawer activeOrder={cart} />
            </Stack>
          </Stack>
        </ContentContainer>
        {navigationSearch.searchOpen && (
          <MobileNavigationContainer ref={searchMobileRef}>
            <NavigationSearch {...navigationSearch} />
          </MobileNavigationContainer>
        )}
      </StickyContainer>

      {categories?.length > 0 ? <CategoryBar collections={categories} /> : null}
    </>
  );
};

const StickyContainer = styled.nav`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 100%;
    padding: 2rem;
    position: sticky;
    top: 0;
    background: ${(p) => p.theme.gray(0)};
    z-index: 2137;
    border-bottom: 1px solid ${(p) => p.theme.gray(100)};
    svg {
        max-height: 4rem;
    }
`;

const MobileNavigationContainer = styled.div`
    display: block;
    padding: 2.5rem 2rem 0 2rem;
    width: 100%;
    @media (min-width: ${(p) => p.theme.breakpoints.md}) {
        display: none;
    }
`;

const DesktopNavigationContainer = styled(motion.div)`
    display: none;
    @media (min-width: ${(p) => p.theme.breakpoints.md}) {
        display: block;
    }
`;
