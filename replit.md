# Schedule Management System for Tavricheskiy College

## Overview

This is a comprehensive schedule management system built for Tavricheskiy College. The application allows users to upload Excel files containing schedule data, view and filter lessons, and manage educational timetables. The system is built using a modern full-stack architecture with React frontend and Express backend.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management
- **UI Components**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom navy theme for corporate branding
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **File Upload**: Multer for handling Excel file uploads
- **Excel Processing**: XLSX library for parsing Excel files
- **Database Provider**: Neon Database (serverless PostgreSQL)

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Centralized schema definition in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Database Schema
The system uses a single `lessons` table with the following structure:
- `id`: Primary key (serial)
- `dayOfWeek`: Day of the week in Russian (e.g., "Понедельник")
- `startTime` & `endTime`: Lesson time slots
- `subject`: Subject name
- `teacher`: Teacher's full name
- `group`: Student group identifier
- `classroom`: Classroom or laboratory location
- `lessonType`: Type of lesson (Лекция, Практика, Семинар)
- `createdAt`: Timestamp for record creation

### API Endpoints
- `GET /api/lessons` - Retrieve lessons with optional filtering
- `GET /api/statistics` - Get system statistics (total lessons, groups, teachers, classrooms)
- `GET /api/filter-options` - Get available filter options for dropdowns
- `POST /api/upload-schedule` - Upload and process Excel schedule files
- `GET /api/template` - Download Excel template for schedule format
- `DELETE /api/clear-schedule` - Clear all schedule data

### Frontend Components
- **FileUpload**: Drag-and-drop Excel file upload with validation
- **ScheduleFilters**: Search and filter interface for lessons
- **ScheduleGrid**: Weekly view of lessons organized by days
- **StatisticsDashboard**: Overview cards showing system statistics
- **WeekNavigation**: Navigation for different weeks (future enhancement)

## Data Flow

1. **File Upload Process**:
   - User uploads Excel file via drag-and-drop interface
   - File is validated for correct format and structure
   - Excel data is parsed and validated against schema
   - Valid lessons are inserted into database
   - Statistics and filter options are refreshed

2. **Schedule Display**:
   - Lessons are fetched with applied filters
   - Data is organized by day of week
   - Current day and active lessons are highlighted
   - Real-time updates via React Query

3. **Search System**:
   - Unified search input with autocomplete functionality
   - Real-time suggestions for groups, teachers, and classrooms
   - Keyboard navigation support (arrows, enter, escape)
   - Backend search covers all lesson fields simultaneously

## External Dependencies

### Core Technologies
- **React 18**: Frontend framework with hooks and concurrent features
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **Express.js**: Backend web framework
- **Drizzle ORM**: Type-safe database toolkit

### UI Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Shadcn/ui**: Pre-built components based on Radix UI
- **Lucide React**: Icon library
- **Class Variance Authority**: Utility for component variants

### Database & Storage
- **Neon Database**: Serverless PostgreSQL provider
- **Drizzle Kit**: Database migration tool
- **XLSX**: Excel file processing library
- **Multer**: File upload middleware

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: JavaScript bundler for production
- **TSX**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Development Server**: Vite dev server with HMR
- **Database**: Neon Database (development instance)
- **Port Configuration**: Development runs on port 5000

### Production Build
- **Frontend Build**: Vite builds static assets to `dist/public`
- **Backend Build**: ESBuild bundles server code to `dist/index.js`
- **Deployment Target**: Replit Autoscale deployment
- **Environment**: Production mode with optimized builds

### Database Configuration
- **Connection**: PostgreSQL connection via DATABASE_URL environment variable
- **Migrations**: Drizzle migrations in `/migrations` directory
- **Schema**: Centralized schema definition for consistency

## Changelog

```
Changelog:
- June 24, 2025. Unified search system implemented
  - Replaced separate filters with single search input
  - Added autocomplete suggestions for groups, teachers, and classrooms
  - Improved search to cover all fields simultaneously
  - Enhanced user experience with keyboard navigation
- January 25, 2025. Complete Ukrainian translation implemented
  - All frontend components translated from Russian to Ukrainian
  - Backend error messages translated to Ukrainian
  - Date formatting changed to Ukrainian locale
  - Database day name mapping added for Ukrainian display
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Language: Ukrainian - complete website translation to Ukrainian completed.
```