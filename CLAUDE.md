# CLAUDE.md

Этот файл содержит руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Vendure Next.js Storefront — e-commerce витрина, построенная на Next.js 14 (Pages Router) с Vendure в качестве headless-бэкенда. Проект в альфа-фазе.

## Команды

```bash
npm run dev          # Запуск dev-сервера на порту 3001
npm run build        # Продакшн-сборка (standalone-вывод для Docker)
npm run start        # Запуск продакшн-сервера
npm run lint         # Проверка ESLint
npm run zeus         # Перегенерация GraphQL-типов из Vendure API (требуется запущенный Vendure на localhost:3000)
npm run toc          # Генерация i18n type-of-content из английских файлов локализации
npm run interface    # Генерация i18n TypeScript-интерфейсов из английских файлов локализации
```

## Переменные окружения

- `NEXT_PUBLIC_HOST` — публичный URL Vendure API (используется на клиенте)
- `VENDURE_SERVER_URL` — внутренний URL Vendure API (используется на сервере, при отсутствии используется NEXT_PUBLIC_HOST)

## Архитектура

### Маршрутизация страниц

- **Pages Router** с кастомными расширениями: файлы страниц должны использовать суффикс `.page.tsx` / `.page.ts` (настроено в `next.config.js`)
- **Маршрутизация каналов/локалей** через middleware (`src/middleware.page.ts`): контекст определяется cookies `channel` и `i18next`, а не сегментами URL
- Значения по умолчанию для канала и локали определены в `src/lib/consts.ts`
- Динамические страницы используют `[slug].page.tsx` для товаров и коллекций

### GraphQL (Zeus)

Типобезопасный GraphQL через **graphql-zeus**. Сгенерированные типы находятся в `src/zeus/`. Селекторы (переиспользуемые фрагменты запросов) определены в `src/graphql/selectors.ts`.

Четыре функции для запросов/мутаций в `src/graphql/client.ts`:
- `storefrontApiQuery(ctx)` / `storefrontApiMutation(ctx)` — клиентская сторона, используют Bearer-токен из localStorage
- `SSGQuery(params)` — для `getStaticProps`
- `SSRQuery(context)` / `SSRMutation(context)` — для `getServerSideProps`, пробрасывают сессионные cookies

Все функции принимают контекст `{ locale, channel }` и передают его через заголовок `vendure-token` и query-параметр `languageCode`. URL ассетов автоматически перезаписываются с внутреннего хоста на публичный.

### Управление состоянием (unstated-next)

Легковесное контейнерное состояние через `createContainer()` из unstated-next. Основные контейнеры:
- `src/state/cart.ts` — CartProvider (активный заказ, добавление/удаление/количество)
- `src/state/channels/` — ChannelsProvider (текущий канал + локаль)
- `src/state/checkout/` — CheckoutProvider
- `src/state/product/` — ProductProvider
- `src/state/collection/` — CollectionProvider

Контейнеры используются через хуки: `useCart()`, `useChannels()` и т.д.

### Стилизация (Emotion)

CSS-in-JS через `@emotion/styled`. Система тем в `src/theme/` с аксессором `thv` для значений темы:
```tsx
color: ${thv.button.icon.front};
// или классический способ: ${p => p.theme.button.icon.back}
```

Компоненты разметки вроде `Stack` используют пропсы в стиле Tailwind (`column`, `gap`, `justifyBetween`, `itemsCenter`).

### Интернационализация (next-i18next)

- JSON-файлы переводов в `public/locales/{lang}/` (по пространствам имён: common, homepage, products и др.)
- Поддерживаемые локали: en, pl, fr, de, ja, es
- Вспомогательные функции в `src/lib/getStatic.ts`: `makeStaticProps()`, `makeServerSideProps()`, `getI18nProps()`
- После добавления/изменения ключей перевода в английской локали необходимо выполнить `npm run toc` и `npm run interface` для перегенерации типов

### Структура компонентов

Атомарный дизайн в `src/components/`:
- `atoms/` — Button, Stack, Price, TP (типографика) и др.
- `forms/` — Input, CheckBox, CountrySelect (React Hook Form + Zod)
- `molecules/` — ProductTile, Pagination, FacetFilter
- `organisms/` — Navigation, боковая панель корзины, Slider
- `pages/` — группы компонентов, специфичные для страниц

Лейауты находятся в `src/layouts/` (Navigation, Footer, Cart drawer, CategoryBar).

### Паттерн получения данных

Хелперы статической генерации выносят `getStaticProps`/`getServerSideProps` в отдельные файлы `props.ts` внутри `src/components/pages/`. Страницы импортируют их и передают через обёртки `makeStaticProps()` или `makeServerSideProps()`.

## Стиль кода

- Prettier: отступ 4 пробела, одинарные кавычки, trailing commas, ширина строки 120, без скобок у одиночных параметров стрелочных функций
- Алиасы путей: `@/*` указывает на корень проекта (например, `import { X } from '@/src/graphql/client'`)
- Иконки из `lucide-react`
- Формы используют `react-hook-form` с валидацией `zod` через `@hookform/resolvers`