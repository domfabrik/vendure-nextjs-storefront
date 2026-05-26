# CLAUDE.md

Руководство для Claude Code при работе с кодом в этом репозитории.

## Обзор проекта

E-commerce витрина магазина мебели DomFabrik. Next.js 16 (App Router) + Vendure headless-бэкенд. Локаль всегда `ru`, канал `default-channel`.

## Команды

```bash
yarn dev             # Dev-сервер на порту 3001 (Turbopack)
yarn build           # prebuild + next build (standalone для Docker)
yarn start           # Продакшн-сервер на порту 3001
yarn lint            # Biome check + tsc --noEmit
yarn lint:fsd        # Steiger — проверка FSD-архитектуры
yarn prebuild        # yarn lint && yarn lint:fsd (также pre-commit hook через husky)
yarn format          # Biome check --write (автоформатирование)
```

## Переменные окружения

- `NEXT_PUBLIC_HOST` — публичный URL Vendure API (по умолчанию `https://domfabrik.ru`)

## Архитектура (Feature-Sliced Design)

```
src/
├── app/                        # Страницы (App Router, server components по умолчанию)
│   ├── layout.tsx              # Корневой layout: Theme, GlobalStyles, Header, Container
│   ├── page.tsx                # Главная — коллекции с товарами
│   ├── cart/page.tsx           # Корзина (client component, zustand)
│   ├── search/page.tsx         # Поиск с фасетными фильтрами (client component)
│   ├── collections/[slug]/     # Страница коллекции
│   └── products/[slug]/        # Страница товара (product-details.tsx, product-gallery.tsx)
│
├── lib/                        # Утилиты
│   ├── price-formatter.ts      # Форматирование цен (копейки → ₽, Intl.NumberFormat)
│   └── array-to-tree.ts        # Построение дерева из плоского массива (для категорий)
│
└── shared/                     # Shared-слой FSD
    ├── api/                    # API-слой (graphql-request + Vendure Shop API)
    │   ├── api-client.ts       # GraphQLClient с vendure-token и languageCode=RU
    │   ├── products/           # getProductBySlug, getFeaturedProducts, getProductSliders
    │   ├── search/             # searchProducts (term, facets, sort, pagination)
    │   ├── collections/        # getAllCollections, getCollectionBySlug, getProductsByCollection, getNavigationTree
    │   ├── orders/             # getActiveOrder, getOrderByCode
    │   ├── customer/           # getActiveCustomer
    │   └── checkout/           # getEligibleShippingMethods, getEligiblePaymentMethods
    ├── store/                  # Zustand-сторы
    │   └── cart.ts             # useCartStore — корзина с persist в localStorage
    └── ui/                     # UI-компоненты (MUI v9)
        ├── theme/              # MUI ThemeProvider
        ├── global-styles/      # GlobalStyles
        ├── header/             # Header (server) + CatalogDrawer, Search, CartBadge (client)
        ├── product-card/       # Карточка товара с кнопкой «В корзину»
        └── add-to-cart-button/ # Кнопка добавления в корзину
```

### Правила FSD

- Каждый модуль в `shared/` имеет `index.ts` (публичный API). Импорты извне — только через публичный API.
- Steiger проверяет архитектуру: `yarn lint:fsd`.
- `src/app/` — слой pages, `src/shared/` — shared-слой, `src/lib/` — утилиты.

### API-слой

Каждый домен (`products/`, `search/`, `collections/` и т.д.) содержит:
- `model.ts` — типы + GraphQL-запросы (gql-шаблоны)
- `api.ts` — серверные async-функции (`'use server'`)
- `index.ts` — публичные экспорты

GraphQL-клиент: `graphql-request` → `src/shared/api/api-client.ts`. Endpoint: `{NEXT_PUBLIC_HOST}/shop-api?languageCode=RU`, заголовок `vendure-token: default-channel`.

### Состояние

Zustand с `persist` middleware (localStorage). Единственный стор — `useCartStore` (корзина). Бэкенд-интеграции корзины нет — только localStorage.

### Server / Client компоненты

- Страницы и layout — server components (`'use server'`), данные загружаются через async-функции из `shared/api`
- Интерактивные части (корзина, поиск, галерея, выбор вариантов) — client components (`'use client'`)

## Стиль кода

- **Biome**: отступ 2 пробела, одинарные кавычки, двойные кавычки в JSX, trailing commas, ширина строки 180, LF
- **JSX-атрибуты**: multiline (каждый атрибут на новой строке)
- **Алиас путей**: `@/*` → `./src/*` (например `import { X } from '@/shared/api'`)
- **Иконки**: `@mui/icons-material` (не lucide-react)
- **Формы**: `react-hook-form` + `zod`
- **Pre-commit**: husky запускает `yarn prebuild`
