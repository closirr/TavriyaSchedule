# Technology Stack

## Frontend
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling with custom design system
- **Radix UI** components for accessible UI primitives
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

## Backend
- **Express.js** with TypeScript
- **Node.js** ESM modules
- **Drizzle ORM** with PostgreSQL
- **Neon Database** (serverless PostgreSQL)
- **Zod** for schema validation
- **Multer** for file uploads

## Document Generation
- **jsPDF** with AutoTable plugin
- **PDFKit** for PDF generation
- **Puppeteer** for HTML-to-PDF conversion
- **html-pdf** library
- **XLSX** for Excel file processing

## Development Tools
- **TypeScript 5.6** with strict mode
- **ESBuild** for server bundling
- **TSX** for development server
- **Drizzle Kit** for database migrations

## Common Commands

```bash
# Development
npm run dev          # Start development server (Linux/Mac)
npm run dev:win      # Start development server (Windows)

# Building
npm run build        # Build both client and server for production
npm run check        # TypeScript type checking

# Database
npm run db:push      # Push schema changes to database

# Production
npm run start        # Start production server
```

## Environment Configuration
- **Automatic Environment Detection**: The app automatically detects if running locally or in production
- **Local Development**: API calls go to `http://localhost:5000`, detailed logging enabled
- **Production**: API calls go to `https://tavriyascheduleapi.onrender.com`, minimal logging
- **CORS**: Automatically configured for appropriate origins based on environment

## Windows Development Notes
- Use `npm run dev:win` for Windows development
- Server runs on `http://localhost:5000` by default
- Frontend dev server runs on `http://localhost:5173`

## Environment Setup
- Requires `DATABASE_URL` environment variable
- Uses ESM modules throughout
- Configured for deployment on Replit/Render