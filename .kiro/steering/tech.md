# Technology Stack

## Architecture
**Static SPA (Single Page Application)** - чисто клієнтський додаток без бекенда. Дані завантажуються з Google Sheets через публічний CSV експорт.

## Frontend
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling with custom design system
- **Radix UI** components for accessible UI primitives
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **Zod** for data validation
- **Framer Motion** for animations

## Data Source
- **Google Sheets** - розклад зберігається в Google Таблицях
- **CSV Export** - дані завантажуються через публічний CSV URL
- **Client-side parsing** - парсинг CSV відбувається в браузері

## Document Generation (Client-side)
- **Browser Print API** - друк через вбудований механізм браузера
- **CSS Print Styles** - стилі для друку

## Development Tools
- **TypeScript 5.6** with strict mode
- **Vitest** for testing

## Common Commands

```bash
# Development
npm run dev          # Start Vite dev server

# Building
npm run build        # Build static site for production
npm run check        # TypeScript type checking

# Testing
npm run test         # Run tests
```

## Environment Configuration
- **VITE_GOOGLE_SHEET_ID** - ID Google таблиці з розкладом
- **VITE_GOOGLE_SHEET_GID** - GID конкретного аркуша

## Deployment
- Статичний сайт можна хостити на будь-якому статичному хостингу (Netlify, Vercel, GitHub Pages, тощо)
- Build output: `dist/` folder