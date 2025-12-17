/**
 * Shared Schema Module
 * 
 * Re-exports types from the client types module for backward compatibility.
 * This file exists to maintain the @shared path alias functionality.
 */

import { z } from "zod";

// Re-export types from client types (these are the canonical definitions)
export type {
  Lesson,
  DayOfWeek,
  ScheduleFilters,
  FilterOptions,
  ScheduleStatistics,
  ScheduleState,
  ParseResult,
  ParseError,
  FetchResult,
} from "../client/src/types/schedule";

export { DAYS_OF_WEEK } from "../client/src/types/schedule";

// Zod schemas for validation (kept for backward compatibility)
export const scheduleFiltersSchema = z.object({
  search: z.string().optional(),
  group: z.string().optional(),
  teacher: z.string().optional(),
  classroom: z.string().optional()
});
