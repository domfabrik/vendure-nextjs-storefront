# CLAUDE.md

Руководство для Claude Code при работе с кодом в этом репозитории.

## Обзор проекта

E-commerce витрина магазина мебели DomFabrik. Next.js 16 (App Router) + Vendure headless-бэкенд. Локаль всегда `ru`, канал `default-channel`.

## Переменные окружения

- `NEXT_PUBLIC_HOST` — публичный URL Vendure API (по умолчанию `https://domfabrik.ru`)

## Архитектура (Feature-Sliced Design)

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
- **Иконки**: `@mui/icons-material`
- **Формы**: `react-hook-form` + `zod`
- **Pre-commit**: husky запускает `yarn prebuild`

## Правила
- Всегда отвечай на русском
- Для ссылок и редиректов всегда используй routes
- После выполнения задачи выполняй yarn format и yarn prebuild и исправляй ошибки, если они возникнут
- Все запросы должны идти из серверных компонентов или из серверных экшенов
- Для установки пакетов используй npm