# Implementation Plan

- [x] 1. Set up project structure and remove server dependencies






  - [x] 1.1 Remove server-side code and dependencies

    - Delete `server/` directory (routes.ts, storage.ts, all generators)
    - Remove server dependencies from package.json (express, multer, pdfkit, puppeteer, etc.)
    - Update build scripts to client-only build
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x]* 1.2 Add fast-check testing library

    - Install fast-check as dev dependency
    - Configure vitest for property-based testing
    - _Requirements: Testing Strategy_

  - [x] 1.3 Create new directory structure for logic layer

    - Create `client/src/lib/__tests__/` directory
    - Create `client/src/types/` directory for shared types
    - _Requirements: 8.1, 8.2_

- [x] 2. Implement types and data models






  - [x] 2.1 Create TypeScript types module

    - Create `client/src/types/schedule.ts` with Lesson, ScheduleFilters, FilterOptions, ScheduleStatistics, ScheduleState interfaces
    - Define DayOfWeek type
    - Export all types
    - _Requirements: 8.3_

- [x] 3. Implement configuration module




  - [x] 3.1 Create config module for Google Sheets URL

    - Create `client/src/lib/google-sheets-config.ts`
    - Implement getConfig() function reading from environment
    - Implement validateGoogleSheetsUrl() function
    - _Requirements: 5.1, 5.2, 5.3_
  - [x]* 3.2 Write property test for URL validation

    - **Property 6: Google Sheets URL Validation**
    - **Validates: Requirements 5.3**

- [x] 4. Implement CSV parser

  - [x] 4.1 Create CSV parser module
    - Create `client/src/lib/csv-parser.ts`
    - Implement parseScheduleCSV() function
    - Use Zod for row validation
    - Return ParseResult with lessons and errors
    - _Requirements: 1.2, 1.3, 1.5_

  - [x]* 4.2 Write property test for CSV round trip
    - **Property 1: CSV Parsing Round Trip**
    - **Validates: Requirements 1.2**

  - [x]* 4.3 Write property test for invalid row filtering
    - **Property 2: Invalid Row Filtering**
    - **Validates: Requirements 1.3, 1.5**

- [x] 5. Implement schedule utility functions

  - [x] 5.1 Create schedule utils module
    - Create `client/src/lib/schedule-utils.ts`
    - Implement filterLessons() function
    - Implement extractFilterOptions() function
    - Implement calculateStatistics() function
    - Implement sortLessonsByDayAndTime() function
    - Implement generateLessonId() function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_
  - [x]* 5.2 Write property test for filter options uniqueness
    - **Property 3: Filter Options Uniqueness**
    - **Validates: Requirements 2.1**
  - [x] 5.3 Write property test for filter correctness (group filter)
    - **Property 4: Filter Correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
  - [x]* 5.4 Write property test for statistics invariants
    - **Property 5: Statistics Invariants**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [x]* 5.5 Write property test for utility function purity
    - **Property 7: Utility Function Purity**
    - **Validates: Requirements 8.2**
  - [x]* 5.6 Write property test for sort order consistency
    - **Property 8: Sort Order Consistency**
    - **Validates: Requirements 2.2**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Google Sheets fetcher






  - [x] 7.1 Create Google Sheets fetcher module







    - Create `client/src/lib/google-sheets-fetcher.ts`
    - Implement fetchGoogleSheetsCSV() function
    - Handle network errors with retry logic
    - Return FetchResult with data and timestamp
    - _Requirements: 1.1, 1.4, 6.2_

- [x] 8. Implement data hook





  - [x] 8.1 Create useScheduleData hook

    - Create `client/src/hooks/useScheduleData.ts`
    - Use React Query for data fetching and caching
    - Integrate CSV parser and schedule utils
    - Expose filtered lessons, filters, statistics, loading state
    - Implement refresh functionality
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1_

- [x] 9. Update UI components to use new data hook

  - [x] 9.1 Update schedule page component
    - Modify `client/src/pages/schedule.tsx`
    - Use useScheduleData hook instead of API calls
    - Pass data to child components via props
    - _Requirements: 8.4_
  - [x] 9.2 Update LoadingMetricsDisplay component
    - Modify `client/src/components/loading-metrics.tsx`
    - Remove file upload functionality
    - Add refresh button and last updated timestamp
    - Accept props for isLoading, lastUpdated, onRefresh
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  - [x] 9.3 Update ScheduleFilters component
    - Modify `client/src/components/schedule-filters.tsx`
    - Accept filterOptions as prop instead of fetching
    - _Requirements: 2.1, 8.4_
  - [x] 9.4 Update ScheduleGrid component
    - Modify `client/src/components/schedule-grid.tsx`
    - Accept lessons as prop instead of fetching
    - _Requirements: 8.4_
  - [x] 9.5 Update StatisticsDashboard component
    - Modify `client/src/components/statistics-dashboard.tsx`
    - Accept statistics as prop instead of fetching
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.4_

- [x] 10. Remove unused components and files




  - [x] 10.1 Delete file upload component


    - Delete `client/src/components/file-upload.tsx`
    - _Requirements: 4.2_

  - [x] 10.2 Delete template gallery component

    - Delete `client/src/components/template-gallery.tsx`
    - _Requirements: 4.3_



  - [x] 10.3 Clean up unused imports and dependencies

    - Remove unused imports from all modified files
    - Remove unused API utility functions

    - _Requirements: 4.1, 4.2, 4.3, 4.4_




- [x] 11. Update build configuration

  - [x] 11.1 Update Vite config for static build
    - Modify `vite.config.ts` for client-only build
    - Configure environment variables for Google Sheets URL
    - _Requirements: 5.1_
  - [x] 11.2 Update package.json scripts
    - Remove server-related scripts
    - Update build script for static site
    - Add preview script for local testing
    - _Requirements: 4.1_

- [ ] 12. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

