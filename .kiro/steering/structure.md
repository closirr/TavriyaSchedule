# Project Structure

## Root Level
- **package.json** - Main project configuration with scripts and dependencies
- **tsconfig.json** - TypeScript configuration with path aliases
- **vite.config.ts** - Vite build configuration
- **tailwind.config.ts** - Tailwind CSS configuration with custom theme
- **drizzle.config.ts** - Database ORM configuration

## Directory Organization

### `/client` - Frontend Application
- **index.html** - Main HTML entry point
- **src/App.tsx** - Root React component with routing
- **src/main.tsx** - React application entry point
- **src/pages/** - Route components (schedule.tsx, not-found.tsx)
- **src/components/** - Reusable React components
- **src/components/ui/** - Radix UI component library
- **src/hooks/** - Custom React hooks
- **src/lib/** - Utility functions and configurations

### `/server` - Backend API
- **index.ts** - Express server entry point
- **routes.ts** - API route definitions
- **storage.ts** - Database operations
- **vite.ts** - Development server setup
- **\*-generator.ts** - Various PDF/document generation utilities

### `/shared` - Common Code
- **schema.ts** - Drizzle database schema and Zod validation schemas

### `/attached_assets` - Static Files
- Images, PDFs, and other uploaded assets

## Path Aliases
- `@/*` → `./client/src/*` (frontend components)
- `@shared/*` → `./shared/*` (shared schemas)
- `@assets/*` → `./attached_assets/*` (static assets)

## Naming Conventions
- **Components**: PascalCase (e.g., `ScheduleGrid.tsx`)
- **Files**: kebab-case (e.g., `schedule-filters.tsx`)
- **Directories**: lowercase with hyphens
- **Database**: snake_case for columns, camelCase for TypeScript

## Build Output
- **dist/public/** - Built frontend assets
- **dist/index.js** - Bundled server code