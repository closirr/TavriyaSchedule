/**
 * useScheduleData Hook
 * 
 * Custom React hook that manages schedule data fetching, caching, filtering,
 * and state management. Uses React Query for data fetching and caching.
 * 
 * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

const STORAGE_KEY = 'tavriya-schedule-group';
import type {
  Lesson,
  ScheduleFilters,
  FilterOptions,
  ScheduleStatistics,
  ScheduleMetadata,
} from '../types/schedule';
import { parseScheduleCSV } from '../lib/csv-parser';
import {
  filterLessons,
  extractFilterOptions,
  calculateStatistics,
  sortLessonsByDayAndTime,
  calculateAcademicWeek,
  getEffectiveWeek,
} from '../lib/schedule-utils';
import { fetchGoogleSheetsCSVOrThrow } from '@/lib/google-sheets-fetcher';
import { getConfig } from '@/lib/google-sheets-config';

/**
 * Query key for schedule data
 */
const SCHEDULE_QUERY_KEY = ['schedule-data'] as const;

/**
 * Return type for useScheduleData hook
 */
export interface UseScheduleDataReturn {
  /** All lessons loaded from the data source */
  lessons: Lesson[];
  /** Lessons after applying current filters */
  filteredLessons: Lesson[];
  /** Current filter settings */
  filters: ScheduleFilters;
  /** Update filter settings */
  setFilters: (filters: ScheduleFilters) => void;
  /** Available options for filter dropdowns */
  filterOptions: FilterOptions;
  /** Calculated statistics from all lessons */
  statistics: ScheduleStatistics;
  /** Whether data is currently being loaded */
  isLoading: boolean;
  /** Error message if data loading failed, null otherwise */
  error: string | null;
  /** Timestamp of the last successful data fetch */
  lastUpdated: Date | null;
  /** Trigger a manual refresh of the data */
  refresh: () => void;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Configuration error if Google Sheets URL is not set */
  configError: string | null;
  /** Schedule metadata (week number, format, semester) */
  metadata: ScheduleMetadata | null;
  /** Current academic week (1 or 2), auto-calculated or from Excel */
  currentWeek: 1 | 2;
  /** Whether the week was manually set from Excel */
  isWeekManual: boolean;
}


/**
 * Fetches and parses schedule data from Google Sheets
 */
async function fetchScheduleData(): Promise<{
  lessons: Lesson[];
  fetchedAt: Date;
  parseErrors: number;
  metadata?: ScheduleMetadata;
}> {
  const fetchResult = await fetchGoogleSheetsCSVOrThrow();
  const parseResult = parseScheduleCSV(fetchResult.data);
  
  // Log parse errors for debugging (Requirements 1.5)
  if (parseResult.errors.length > 0) {
    console.warn(
      `Schedule parsing: ${parseResult.errors.length} invalid rows skipped`,
      parseResult.errors
    );
    
    // Warn if more than 10% of rows are invalid
    const totalRows = parseResult.lessons.length + parseResult.errors.length;
    if (totalRows > 0 && parseResult.errors.length / totalRows > 0.1) {
      console.warn(
        `Warning: More than 10% of rows (${parseResult.errors.length}/${totalRows}) are invalid`
      );
    }
  }
  
  // Sort lessons by day and time
  const sortedLessons = sortLessonsByDayAndTime(parseResult.lessons);
  
  return {
    lessons: sortedLessons,
    fetchedAt: fetchResult.fetchedAt,
    parseErrors: parseResult.errors.length,
    metadata: parseResult.metadata,
  };
}

/**
 * Custom hook for managing schedule data
 * 
 * Provides:
 * - Data fetching from Google Sheets with caching
 * - Filtering by group, teacher, classroom, and search text
 * - Statistics calculation
 * - Manual refresh functionality
 * - Loading and error states
 * 
 * @returns UseScheduleDataReturn object with all schedule data and controls
 */
export function useScheduleData(): UseScheduleDataReturn {
  // Check configuration first
  const configResult = getConfig();
  const configError = configResult.success ? null : configResult.error.message;
  
  // Local state for filters - initialize with saved group from localStorage
  const [filters, setFiltersState] = useState<ScheduleFilters>(() => {
    try {
      const savedGroup = localStorage.getItem(STORAGE_KEY);
      return savedGroup ? { group: savedGroup } : {};
    } catch {
      return {};
    }
  });
  
  // Fetch schedule data using React Query
  const {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: fetchScheduleData,
    enabled: configResult.success, // Only fetch if config is valid
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(5000 * Math.pow(2, attemptIndex), 30000),
  });
  
  // Extract lessons from query data
  const lessons = data?.lessons ?? [];
  const lastUpdated = data?.fetchedAt ?? null;
  const metadata = data?.metadata ?? null;
  
  // Calculate current academic week
  // Priority: manual override from Excel > automatic calculation from Sept 1
  const manualWeekFromExcel = metadata?.currentWeek;
  const currentWeek = getEffectiveWeek(manualWeekFromExcel);
  const isWeekManual = manualWeekFromExcel === 1 || manualWeekFromExcel === 2;
  
  // Calculate filter options from all lessons (Requirements 2.1)
  const filterOptions = useMemo(
    () => extractFilterOptions(lessons),
    [lessons]
  );
  
  // Calculate statistics from all lessons (Requirements 3.1, 3.2, 3.3, 3.4)
  const statistics = useMemo(
    () => calculateStatistics(lessons),
    [lessons]
  );
  
  // Apply filters to lessons (Requirements 2.2, 2.3, 2.4, 2.5)
  // DON'T filter by week here - let schedule-grid handle week display for alternating lessons
  const filteredLessons = useMemo(
    () => filterLessons(lessons, { ...filters }),
    [lessons, filters]
  );
  
  // Memoized setFilters callback - saves only group to localStorage
  const setFilters = useCallback((newFilters: ScheduleFilters) => {
    setFiltersState(newFilters);
    // Only save/overwrite when a GROUP is selected
    // Teacher, classroom, search, or clearing filters should NOT affect saved group
    try {
      if (newFilters.group) {
        localStorage.setItem(STORAGE_KEY, newFilters.group);
      }
      // Never clear localStorage - only group selection can overwrite it
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  
  // Refresh function (Requirements 6.3, 7.2)
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Format error message
  const errorMessage = error instanceof Error ? error.message : null;
  
  return {
    lessons,
    filteredLessons,
    filters,
    setFilters,
    filterOptions,
    statistics,
    isLoading,
    error: configError || errorMessage,
    lastUpdated,
    refresh,
    isRefreshing: isFetching && !isLoading,
    configError,
    metadata,
    currentWeek,
    isWeekManual,
  };
}
