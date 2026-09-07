/**
 * Schedule Utils Property Tests
 * 
 * Property-based tests for schedule utility functions using fast-check.
 * Tests validate filtering, statistics, and sorting correctness.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  filterLessons,
  extractFilterOptions,
  calculateStatistics,
  sortLessonsByDayAndTime,
  generateLessonId,
  calculateAcademicWeek,
} from '../schedule-utils';
import type { Lesson, ScheduleFilters, DayOfWeek, WeekNumber } from '../../types/schedule';
import { DAYS_OF_WEEK } from '../../types/schedule';

/**
 * Generator for valid time strings in HH:MM format
 */
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/**
 * Generator for valid day of week
 */
const dayOfWeekArb = fc.constantFrom(...DAYS_OF_WEEK) as fc.Arbitrary<DayOfWeek>;

/**
 * Generator for non-empty strings
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for valid lesson with ID
 */
const lessonArb: fc.Arbitrary<Lesson> = fc.record({
  dayOfWeek: dayOfWeekArb,
  startTime: timeArb,
  endTime: timeArb,
  subject: nonEmptyStringArb,
  teacher: nonEmptyStringArb,
  group: nonEmptyStringArb,
  classroom: nonEmptyStringArb,
}).chain((data) =>
  fc.nat({ max: 10000 }).map((idx) => ({
    ...data,
    id: `${data.dayOfWeek}-${data.startTime}-${data.group}-${idx}`.replace(/\s+/g, '_').toLowerCase(),
  }))
);

/**
 * Generator for array of valid lessons
 */
const lessonsArb = fc.array(lessonArb, { minLength: 0, maxLength: 50 });

/**
 * Generator for filter options
 */
const filtersArb: fc.Arbitrary<ScheduleFilters> = fc.record({
  search: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
  group: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
  teacher: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
  classroom: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
});

const DAY_ORDER: Record<DayOfWeek, number> = {
  'Понеділок': 0,
  'Вівторок': 1,
  'Середа': 2,
  'Четвер': 3,
  "П'ятниця": 4,
  'Субота': 5,
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

describe('Schedule Utils', () => {
  /**
   * **Feature: static-site-migration, Property 3: Filter Options Uniqueness**
   * **Validates: Requirements 2.1**
   */
  describe('Property 3: Filter Options Uniqueness', () => {
    it('should return unique groups with no duplicates', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const options = extractFilterOptions(lessons);
          const uniqueGroups = new Set(options.groups);
          expect(options.groups.length).toBe(uniqueGroups.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return unique teachers with no duplicates', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const options = extractFilterOptions(lessons);
          const uniqueTeachers = new Set(options.teachers);
          expect(options.teachers.length).toBe(uniqueTeachers.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return unique classrooms with no duplicates', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const options = extractFilterOptions(lessons);
          const uniqueClassrooms = new Set(options.classrooms);
          expect(options.classrooms.length).toBe(uniqueClassrooms.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should include all groups from lessons', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const options = extractFilterOptions(lessons);
          const expectedGroups = new Set(lessons.map(l => l.group));
          expect(options.groups.length).toBe(expectedGroups.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: static-site-migration, Property 4: Filter Correctness**
   * **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
   */
  describe('Property 4: Filter Correctness', () => {
    it('should return only lessons matching group filter', () => {
      fc.assert(
        fc.property(lessonsArb.filter(l => l.length > 0), (lessons) => {
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
          const filters: ScheduleFilters = { group: randomLesson.group };
          const filtered = filterLessons(lessons, filters);
          
          for (const lesson of filtered) {
            expect(lesson.group).toBe(filters.group);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return only lessons matching teacher filter', () => {
      fc.assert(
        fc.property(lessonsArb.filter(l => l.length > 0), (lessons) => {
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
          const filters: ScheduleFilters = { teacher: randomLesson.teacher };
          const filtered = filterLessons(lessons, filters);
          
          for (const lesson of filtered) {
            expect(lesson.teacher).toBe(filters.teacher);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return only lessons matching classroom filter', () => {
      fc.assert(
        fc.property(lessonsArb.filter(l => l.length > 0), (lessons) => {
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
          const filters: ScheduleFilters = { classroom: randomLesson.classroom };
          const filtered = filterLessons(lessons, filters);
          
          for (const lesson of filtered) {
            expect(lesson.classroom).toBe(filters.classroom);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return lessons matching search in any field', () => {
      fc.assert(
        fc.property(
          lessonsArb.filter(l => l.length > 0),
          fc.string({ minLength: 1, maxLength: 10 }),
          (lessons, searchTerm) => {
            const filters: ScheduleFilters = { search: searchTerm };
            const filtered = filterLessons(lessons, filters);
            
            const searchLower = searchTerm.toLowerCase().trim();
            if (searchLower.length === 0) {
              // Empty search returns all
              expect(filtered.length).toBe(lessons.length);
            } else {
              // All filtered lessons must contain the search term
              for (const lesson of filtered) {
                const matches = 
                  lesson.subject.toLowerCase().includes(searchLower) ||
                  lesson.teacher.toLowerCase().includes(searchLower) ||
                  lesson.group.toLowerCase().includes(searchLower) ||
                  lesson.classroom.toLowerCase().includes(searchLower);
                expect(matches).toBe(true);
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply multiple filters with AND logic', () => {
      fc.assert(
        fc.property(lessonsArb.filter(l => l.length > 0), (lessons) => {
          const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
          const filters: ScheduleFilters = {
            group: randomLesson.group,
            teacher: randomLesson.teacher,
          };
          const filtered = filterLessons(lessons, filters);
          
          for (const lesson of filtered) {
            expect(lesson.group).toBe(filters.group);
            expect(lesson.teacher).toBe(filters.teacher);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return all lessons when no filters applied', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const filtered = filterLessons(lessons, {});
          expect(filtered.length).toBe(lessons.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: static-site-migration, Property 5: Statistics Invariants**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  describe('Property 5: Statistics Invariants', () => {
    it('should have totalLessons equal to lessons.length', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const stats = calculateStatistics(lessons);
          expect(stats.totalLessons).toBe(lessons.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have activeGroups equal to unique group count', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const stats = calculateStatistics(lessons);
          const uniqueGroups = new Set(lessons.map(l => l.group));
          expect(stats.activeGroups).toBe(uniqueGroups.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have teachers equal to unique teacher count', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const stats = calculateStatistics(lessons);
          const uniqueTeachers = new Set(lessons.map(l => l.teacher));
          expect(stats.teachers).toBe(uniqueTeachers.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have classrooms equal to unique classroom count', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const stats = calculateStatistics(lessons);
          const uniqueClassrooms = new Set(lessons.map(l => l.classroom));
          expect(stats.classrooms).toBe(uniqueClassrooms.size);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: static-site-migration, Property 7: Utility Function Purity**
   * **Validates: Requirements 8.2**
   */
  describe('Property 7: Utility Function Purity', () => {
    it('filterLessons should be pure (same input = same output)', () => {
      fc.assert(
        fc.property(lessonsArb, filtersArb, (lessons, filters) => {
          const result1 = filterLessons(lessons, filters);
          const result2 = filterLessons(lessons, filters);
          expect(result1.length).toBe(result2.length);
          for (let i = 0; i < result1.length; i++) {
            expect(result1[i].id).toBe(result2[i].id);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('extractFilterOptions should be pure', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const result1 = extractFilterOptions(lessons);
          const result2 = extractFilterOptions(lessons);
          expect(result1.groups).toEqual(result2.groups);
          expect(result1.teachers).toEqual(result2.teachers);
          expect(result1.classrooms).toEqual(result2.classrooms);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('calculateStatistics should be pure', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const result1 = calculateStatistics(lessons);
          const result2 = calculateStatistics(lessons);
          expect(result1).toEqual(result2);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('sortLessonsByDayAndTime should be pure', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const result1 = sortLessonsByDayAndTime(lessons);
          const result2 = sortLessonsByDayAndTime(lessons);
          expect(result1.length).toBe(result2.length);
          for (let i = 0; i < result1.length; i++) {
            expect(result1[i].id).toBe(result2[i].id);
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should not mutate original array', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const originalIds = lessons.map(l => l.id);
          filterLessons(lessons, { group: 'test' });
          sortLessonsByDayAndTime(lessons);
          extractFilterOptions(lessons);
          calculateStatistics(lessons);
          expect(lessons.map(l => l.id)).toEqual(originalIds);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: static-site-migration, Property 8: Sort Order Consistency**
   * **Validates: Requirements 2.2**
   */
  describe('Property 8: Sort Order Consistency', () => {
    it('should sort lessons by day first, then by time', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const sorted = sortLessonsByDayAndTime(lessons);
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const prevDayOrder = DAY_ORDER[prev.dayOfWeek];
            const currDayOrder = DAY_ORDER[curr.dayOfWeek];
            expect(currDayOrder).toBeGreaterThanOrEqual(prevDayOrder);
            if (currDayOrder === prevDayOrder) {
              expect(timeToMinutes(curr.startTime)).toBeGreaterThanOrEqual(timeToMinutes(prev.startTime));
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all lessons (no loss or duplication)', () => {
      fc.assert(
        fc.property(lessonsArb, (lessons) => {
          const sorted = sortLessonsByDayAndTime(lessons);
          expect(sorted.length).toBe(lessons.length);
          const originalIds = new Set(lessons.map(l => l.id));
          const sortedIds = new Set(sorted.map(l => l.id));
          expect(sortedIds).toEqual(originalIds);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Unit Tests', () => {
    it('filterLessons should handle null input', () => {
      expect(filterLessons(null as any, {})).toEqual([]);
    });

    it('extractFilterOptions should handle null input', () => {
      expect(extractFilterOptions(null as any)).toEqual({ groups: [], teachers: [], classrooms: [] });
    });

    it('calculateStatistics should handle null input', () => {
      expect(calculateStatistics(null as any)).toEqual({ totalLessons: 0, activeGroups: 0, teachers: 0, classrooms: 0 });
    });

    it('sortLessonsByDayAndTime should handle null input', () => {
      expect(sortLessonsByDayAndTime(null as any)).toEqual([]);
    });

    it('generateLessonId should create deterministic IDs', () => {
      const lesson = {
        dayOfWeek: 'Понедельник' as DayOfWeek,
        startTime: '09:00',
        endTime: '10:30',
        subject: 'Математика',
        teacher: 'Іванов І.І.',
        group: 'КН-21',
        classroom: '101',
      };
      const id1 = generateLessonId(lesson, 0);
      const id2 = generateLessonId(lesson, 0);
      expect(id1).toBe(id2);
      expect(id1).toContain('понедельник');
    });
  });
});

/**
 * Real dates taken from "Графік освітнього процесу 2026-2027" (PDF).
 * The schedule numbers weeks 1..52 continuously; each week starts Monday.
 * Week 1 = 31.08.2026 - 06.09.2026 (Sept 1, 2026 is a Tuesday).
 * Odd schedule weeks -> "перший" (1), even -> "другий" (2).
 */
describe('calculateAcademicWeek vs Графік освітнього процесу 2026-2027', () => {
  // [date, schedule week number, day label]
  const scheduleDates: Array<[Date, number, string]> = [
    [new Date(2026, 8, 1), 1, 'вівторок, 1 вересня — сам початок семестру'],
    [new Date(2026, 8, 2), 1, 'середа тижня 1'],
    [new Date(2026, 8, 6), 1, 'неділя тижня 1 (межа тижня)'],
    [new Date(2026, 8, 7), 2, 'понеділок тижня 2 (межа тижня)'],
    [new Date(2026, 8, 13), 2, 'неділя тижня 2'],
    [new Date(2026, 9, 5), 6, 'понеділок тижня 6, жовтень'],
    [new Date(2026, 10, 16), 12, 'понеділок тижня 12, листопад'],
    [new Date(2026, 11, 7), 15, 'понеділок тижня 15, грудень'],
    [new Date(2026, 11, 28), 18, 'понеділок тижня 18 (останній тиждень 1 семестру)'],
    [new Date(2027, 0, 4), 19, 'понеділок тижня 19, січень (канікули/сесія)'],
    [new Date(2027, 0, 10), 19, 'неділя тижня 19 — парність не збивається після Нового року'],
    [new Date(2027, 1, 1), 23, 'понеділок тижня 23 (початок 2 семестру, лютий)'],
    [new Date(2027, 1, 3), 23, 'середина 2 семестру, середа тижня 23'],
    [new Date(2027, 2, 29), 31, 'понеділок тижня 31, березень'],
    [new Date(2027, 3, 12), 33, 'понеділок тижня 33, квітень'],
    [new Date(2027, 4, 31), 40, 'понеділок тижня 40, травень'],
    [new Date(2027, 5, 28), 44, 'понеділок тижня 44, червень'],
    [new Date(2027, 7, 23), 52, 'понеділок тижня 52, серпень'],
    [new Date(2027, 7, 29), 52, 'неділя тижня 52 — останній день графіка'],
  ];

  it.each(scheduleDates)('тиждень графіка %i: %s -> expected %i', (day, scheduleWeek, _label) => {
    const expectedWeek: WeekNumber = (scheduleWeek % 2 === 1) ? 1 : 2;
    expect(calculateAcademicWeek(day)).toBe(expectedWeek);
  });

  it('середина навчального року (січень, канікули) — парність відповідає графіку', () => {
    // Тиждень 21 = 18.01–24.01.2027 (непарний -> "перший")
    expect(calculateAcademicWeek(new Date(2027, 0, 18))).toBe(1);
    expect(calculateAcademicWeek(new Date(2027, 0, 24))).toBe(1);
    // Тиждень 22 = 25.01–31.01.2027 (парний -> "другий")
    expect(calculateAcademicWeek(new Date(2027, 0, 25))).toBe(2);
  });

  it('дата за межами графіка 2026-2027 (липень 2026) — рахується без помилки від попереднього навчального року', () => {
    const week = calculateAcademicWeek(new Date(2026, 6, 15));
    expect([1, 2]).toContain(week);
  });

  it('парність чергується щотижня без розривів через канікули (грудень-лютий)', () => {
    // 52 послідовні дні з 14.12.2026 по 03.02.2027: сусідні тижні мають різну парність
    let previous: WeekNumber = calculateAcademicWeek(new Date(2026, 11, 14));
    for (let offset = 7; offset <= 52; offset += 7) {
      const day = new Date(2026, 11, 14 + offset);
      const current: WeekNumber = calculateAcademicWeek(day);
      expect(current).not.toBe(previous);
      previous = current;
    }
  });
});
