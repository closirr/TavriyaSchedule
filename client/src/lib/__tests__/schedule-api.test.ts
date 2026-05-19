import { describe, expect, it } from 'vitest';
import type { Lesson } from '../../types/schedule';
import { DAYS_OF_WEEK } from '../../types/schedule';
import {
  createScheduleApiIndex,
  createScheduleApiPayload,
  filterScheduleApiPayload,
  parseScheduleApiFilters,
  SCHEDULE_API_SCHEMA_VERSION,
} from '../schedule-api';

const lessons: Lesson[] = [
  {
    id: 'late',
    dayOfWeek: DAYS_OF_WEEK[1],
    startTime: '10:40',
    endTime: '12:10',
    subject: 'Physics',
    teacher: 'Petrenko',
    group: 'KN-22',
    classroom: '202',
  },
  {
    id: 'early',
    dayOfWeek: DAYS_OF_WEEK[0],
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Math',
    teacher: 'Ivanenko',
    group: 'KN-21',
    classroom: '101',
    weekNumber: 1,
  },
  {
    id: 'subgroup',
    dayOfWeek: DAYS_OF_WEEK[0],
    startTime: '12:20',
    endTime: '13:50',
    subject: 'English',
    teacher: 'Shevchenko',
    group: 'KN-21',
    classroom: '303',
    subgroupNumber: 2,
  },
];

describe('Schedule API contract', () => {
  it('creates a stable payload with metadata, options, statistics, and sorted lessons', () => {
    const payload = createScheduleApiPayload({
      lessons,
      metadata: { currentWeek: 1, semester: 'semester' },
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      source: { type: 'google-sheets-csv', url: 'https://example.com/schedule.csv' },
      parseErrors: 2,
    });

    expect(payload.schemaVersion).toBe(SCHEDULE_API_SCHEMA_VERSION);
    expect(payload.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(payload.currentWeek).toBe(1);
    expect(payload.isWeekManual).toBe(true);
    expect(payload.parseErrors).toBe(2);
    expect(payload.statistics).toEqual({
      totalLessons: 3,
      activeGroups: 2,
      teachers: 3,
      classrooms: 3,
    });
    expect(payload.filterOptions.groups).toEqual(['KN-21', 'KN-22']);
    expect(payload.lessons.map((lesson) => lesson.id)).toEqual(['early', 'subgroup', 'late']);
  });

  it('filters API payloads with the same rules used by the UI schedule', () => {
    const payload = createScheduleApiPayload({ lessons });
    const filtered = filterScheduleApiPayload(payload, { group: 'KN-21', subgroup: 2 });

    expect(filtered.lessons.map((lesson) => lesson.id)).toEqual(['early', 'subgroup']);
    expect(filtered.statistics.totalLessons).toBe(2);
    expect(filtered.filterOptions.groups).toEqual(['KN-21']);
  });

  it('parses supported filter query parameters', () => {
    const filters = parseScheduleApiFilters(
      new URLSearchParams('group=KN-21&teacher=Ivanenko&week=2&subgroup=1&search=Math')
    );

    expect(filters).toEqual({
      group: 'KN-21',
      teacher: 'Ivanenko',
      classroom: undefined,
      search: 'Math',
      weekNumber: 2,
      subgroup: 1,
    });
  });

  it('exposes a machine-readable index for static hosting', () => {
    const index = createScheduleApiIndex(new Date('2026-01-01T00:00:00.000Z'));

    expect(index.schemaVersion).toBe(SCHEDULE_API_SCHEMA_VERSION);
    expect(index.endpoints.map((endpoint) => endpoint.path)).toEqual([
      '/api/schedule.json',
      '/api/lessons.json',
      '/api/index.json',
    ]);
  });
});
