/**
 * Schedule Types Module
 * 
 * TypeScript interfaces for all data structures shared between logic and UI layers.
 * These types are designed for the static site migration where data comes from Google Sheets.
 * 
 * Requirements: 8.3
 */

/**
 * Days of the week in Ukrainian
 */
export type DayOfWeek = 
  | 'Понеділок' 
  | 'Вівторок' 
  | 'Середа' 
  | 'Четвер' 
  | "П'ятниця" 
  | 'Субота';

/**
 * Array of all valid days for iteration and validation
 */
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
] as const;

/**
 * Mapping from uppercase day names (as in spreadsheet) to standard format
 */
export const DAY_NAME_MAP: Record<string, DayOfWeek> = {
  'ПОНЕДІЛОК': 'Понеділок',
  'ВІВТОРОК': 'Вівторок',
  'СЕРЕДА': 'Середа',
  'ЧЕТВЕР': 'Четвер',
  "П'ЯТНИЦЯ": "П'ятниця",
  'ПЯТНИЦЯ': "П'ятниця",
  'СУБОТА': 'Субота',
};

/**
 * Week number type (1 or 2 for alternating weeks)
 */
export type WeekNumber = 1 | 2;

/**
 * Subgroup number type (1 or 2 for group splitting)
 * Used when an academic group is divided into two parts attending different lessons
 */
export type SubgroupNumber = 1 | 2;

/**
 * Lesson format type (online or offline)
 */
export type LessonFormat = 'онлайн' | 'офлайн';

/**
 * Represents a single lesson/class in the schedule
 */
export interface Lesson {
  /** Unique identifier for the lesson */
  id: string;
  /** Day of the week when the lesson occurs */
  dayOfWeek: DayOfWeek;
  /** Start time in HH:MM format (e.g., "09:00") */
  startTime: string;
  /** End time in HH:MM format (e.g., "10:30") */
  endTime: string;
  /** Subject/course name */
  subject: string;
  /** Teacher's name */
  teacher: string;
  /** Student group identifier */
  group: string;
  /** Classroom/room number */
  classroom: string;
  /** Lesson number (1, 2, 3, etc.) - optional, from spreadsheet or calculated */
  lessonNumber?: number;
  /** Week number (1 or 2) - optional, for alternating schedules */
  weekNumber?: WeekNumber;
  /** Subgroup number (1 or 2) - optional, for group splitting */
  subgroupNumber?: SubgroupNumber;
  /** Lesson format (online/offline) - optional */
  format?: LessonFormat;
}

/**
 * Schedule metadata extracted from the document
 */
export interface ScheduleMetadata {
  /** Current week number (1 or 2) */
  currentWeek?: WeekNumber;
  /** Default lesson format for the schedule */
  defaultFormat?: LessonFormat;
  /** Semester info (e.g., "2 семестр 2024-2025 н.р.") */
  semester?: string;
}

/**
 * Filter criteria for searching and filtering lessons
 */
export interface ScheduleFilters {
  /** Text search query (searches across subject, teacher, group, classroom) */
  search?: string;
 /** Filter by specific group */
  group?: string;
  /** Filter by specific teacher */
  teacher?: string;
  /** Filter by specific classroom */
  classroom?: string;
  /** Show lessons only for specific week (1/2); undefined = both weeks */
  weekNumber?: WeekNumber;
  /** Filter by specific subgroup (1/2); undefined = show all subgroups */
  subgroup?: SubgroupNumber;
}

/**
 * Available filter options extracted from the schedule data
 */
export interface FilterOptions {
  /** List of unique group names */
  groups: string[];
  /** List of unique teacher names */
  teachers: string[];
  /** List of unique classroom identifiers */
  classrooms: string[];
}

/**
 * Statistics calculated from the schedule data
 */
export interface ScheduleStatistics {
  /** Total number of lessons in the schedule */
  totalLessons: number;
  /** Count of unique active groups */
  activeGroups: number;
  /** Count of unique teachers */
  teachers: number;
  /** Count of unique classrooms */
  classrooms: number;
}

/**
 * Complete state of the schedule data and UI
 */
export interface ScheduleState {
  /** All lessons loaded from the data source */
  lessons: Lesson[];
  /** Lessons after applying current filters */
  filteredLessons: Lesson[];
  /** Current filter settings */
  filters: ScheduleFilters;
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
}

/**
 * Result of parsing CSV data
 */
export interface ParseResult {
  /** Successfully parsed lessons */
  lessons: Lesson[];
  /** Errors encountered during parsing */
  errors: ParseError[];
  /** Metadata extracted from the schedule */
  metadata?: ScheduleMetadata;
}

/**
 * Error information for a failed row parse
 */
export interface ParseError {
  /** Row number (1-indexed) where the error occurred */
  row: number;
  /** Description of what went wrong */
  message: string;
}

/**
 * Result of fetching data from Google Sheets
 */
export interface FetchResult {
  /** Raw CSV data string */
  data: string;
  /** Timestamp when the data was fetched */
  fetchedAt: Date;
}
