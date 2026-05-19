import type {
  FilterOptions,
  Lesson,
  ScheduleFilters,
  ScheduleMetadata,
  ScheduleStatistics,
  SubgroupNumber,
  WeekNumber,
} from '../types/schedule';
import {
  calculateStatistics,
  extractFilterOptions,
  filterLessons,
  getEffectiveWeek,
  sortLessonsByDayAndTime,
} from './schedule-utils';

export const SCHEDULE_API_SCHEMA_VERSION = 1;

export interface ScheduleApiSource {
  type: 'google-sheets-csv';
  url?: string;
}

export interface ScheduleApiPayload {
  schemaVersion: typeof SCHEDULE_API_SCHEMA_VERSION;
  generatedAt: string;
  source: ScheduleApiSource;
  metadata: ScheduleMetadata | null;
  currentWeek: WeekNumber;
  isWeekManual: boolean;
  parseErrors: number;
  statistics: ScheduleStatistics;
  filterOptions: FilterOptions;
  lessons: Lesson[];
}

export interface ScheduleApiIndex {
  schemaVersion: typeof SCHEDULE_API_SCHEMA_VERSION;
  generatedAt: string;
  endpoints: Array<{
    path: string;
    description: string;
  }>;
}

export interface CreateScheduleApiPayloadOptions {
  lessons: Lesson[];
  metadata?: ScheduleMetadata;
  generatedAt?: Date;
  source?: ScheduleApiSource;
  parseErrors?: number;
}

export function createScheduleApiPayload({
  lessons,
  metadata,
  generatedAt = new Date(),
  source = { type: 'google-sheets-csv' },
  parseErrors = 0,
}: CreateScheduleApiPayloadOptions): ScheduleApiPayload {
  const sortedLessons = sortLessonsByDayAndTime(lessons);
  const manualWeek = metadata?.currentWeek;

  return {
    schemaVersion: SCHEDULE_API_SCHEMA_VERSION,
    generatedAt: generatedAt.toISOString(),
    source,
    metadata: metadata ?? null,
    currentWeek: getEffectiveWeek(manualWeek),
    isWeekManual: manualWeek === 1 || manualWeek === 2,
    parseErrors,
    statistics: calculateStatistics(sortedLessons),
    filterOptions: extractFilterOptions(sortedLessons),
    lessons: sortedLessons,
  };
}

export function createScheduleApiIndex(generatedAt = new Date()): ScheduleApiIndex {
  return {
    schemaVersion: SCHEDULE_API_SCHEMA_VERSION,
    generatedAt: generatedAt.toISOString(),
    endpoints: [
      {
        path: '/api/schedule.json',
        description: 'Complete schedule payload with lessons, metadata, statistics, and filter options.',
      },
      {
        path: '/api/lessons.json',
        description: 'Lessons array only, useful for lightweight programmatic access.',
      },
      {
        path: '/api/index.json',
        description: 'Machine-readable API index.',
      },
    ],
  };
}

export function filterScheduleApiPayload(
  payload: ScheduleApiPayload,
  filters: ScheduleFilters
): ScheduleApiPayload {
  const lessons = filterLessons(payload.lessons, filters);

  return {
    ...payload,
    statistics: calculateStatistics(lessons),
    filterOptions: extractFilterOptions(lessons),
    lessons,
  };
}

export function parseScheduleApiFilters(
  params: URLSearchParams | Record<string, string | undefined>
): ScheduleFilters {
  const get = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) ?? undefined : params[key];

  return {
    group: emptyToUndefined(get('group')),
    teacher: emptyToUndefined(get('teacher')),
    classroom: emptyToUndefined(get('classroom')),
    search: emptyToUndefined(get('search')),
    weekNumber: parseWeekNumber(get('weekNumber') ?? get('week')),
    subgroup: parseSubgroupNumber(get('subgroup')),
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseWeekNumber(value: string | undefined): WeekNumber | undefined {
  const trimmed = value?.trim();
  if (trimmed === '1' || trimmed === '2') {
    return Number(trimmed) as WeekNumber;
  }
  return undefined;
}

function parseSubgroupNumber(value: string | undefined): SubgroupNumber | undefined {
  const trimmed = value?.trim();
  if (trimmed === '1' || trimmed === '2') {
    return Number(trimmed) as SubgroupNumber;
  }
  return undefined;
}
