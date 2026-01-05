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
} from '../schedule-utils';
import type { Lesson, ScheduleFilters, DayOfWeek } from '../../types/schedule';
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
