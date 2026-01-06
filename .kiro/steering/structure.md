# Project Structure

## Root Level
- **package.json** - Main project configuration with scripts and dependencies
- **tsconfig.json** - TypeScript configuration with path aliases
- **vite.config.ts** - Vite build configuration
- **tailwind.config.ts** - Tailwind CSS configuration with custom theme

## Directory Organization

### `/client` - Frontend Application (Main Source)
- **index.html** - Main HTML entry point
- **src/App.tsx** - Root React component with routing
- **src/main.tsx** - React application entry point
- **src/pages/** - Route components (schedule.tsx, not-found.tsx)
- **src/components/** - Reusable React components
- **src/components/ui/** - Radix UI component library
- **src/hooks/** - Custom React hooks (useScheduleData.ts)
- **src/lib/** - Utility functions:
  - **google-sheets-fetcher.ts** - завантаження даних з Google Sheets
  - **google-sheets-config.ts** - конфігурація Google Sheets
  - **csv-parser.ts** - парсинг CSV даних
  - **schedule-utils.ts** - утиліти для роботи з розкладом
  - **schedule-printer.ts** - функціонал друку
- **src/types/** - TypeScript типи

### `/shared` - Shared Types
- **schema.ts** - Zod validation schemas and TypeScript types

### `/attached_assets` - Static Files
- Images, PDFs, and other assets

## Path Aliases
- `@/*` → `./client/src/*` (frontend components)
- `@shared/*` → `./shared/*` (shared schemas)
- `@assets/*` → `./attached_assets/*` (static assets)

## Naming Conventions
- **Components**: PascalCase (e.g., `ScheduleGrid.tsx`)
- **Files**: kebab-case (e.g., `schedule-filters.tsx`)
- **Directories**: lowercase with hyphens

## Build Output
- **dist/** - Built static site (HTML, JS, CSS)