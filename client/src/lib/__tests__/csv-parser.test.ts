/**
 * CSV Parser Tests
 *
 * Property-based and unit tests for the public CSV parser API.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseScheduleCSV, lessonsToCSV } from '../csv-parser';
import type { Lesson, DayOfWeek } from '../../types/schedule';
import { DAYS_OF_WEEK } from '../../types/schedule';

const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

const dayOfWeekArb = fc.constantFrom(...DAYS_OF_WEEK) as fc.Arbitrary<DayOfWeek>;

const safeStringArb = fc.string({ minLength: 1, maxLength: 40 })
  .map((value) => value.trim())
  .filter((value) => value.length > 0)
  .filter((value) => !/[\n\r",]/.test(value));

const lessonArb: fc.Arbitrary<Lesson> = fc.record({
  dayOfWeek: dayOfWeekArb,
  startTime: timeArb,
  endTime: timeArb,
  subject: safeStringArb,
  teacher: safeStringArb,
  group: safeStringArb,
  classroom: safeStringArb,
}).chain((data) =>
  fc.nat({ max: 10000 }).map((idx) => ({
    ...data,
    id: `${data.dayOfWeek}-${data.startTime}-${data.group}-${idx}`.replace(/\s+/g, '_').toLowerCase(),
  }))
);

const lessonsArb = fc.array(lessonArb, { minLength: 0, maxLength: 30 });

const groupNameArb = safeStringArb.filter((value) => !['час', 'предмет', 'викладач', 'аудиторія'].includes(value.toLowerCase()));

function buildVerticalCsv(lines: string[]): string {
  return lines.join('\n');
}

function buildVerticalHeader(groupName: string): string[] {
  return [
    `Час,${groupName},,`,
    ',Предмет,Викладач,Аудиторія',
  ];
}

describe('CSV Parser', () => {
  /**
   * **Feature: excel-schedule-parsing-tests, Property 10: Serialization Round Trip**
   * **Validates: Requirements 7.3**
   */
  it('property 10: should preserve lesson data through CSV serialization and parsing', () => {
    fc.assert(
      fc.property(lessonsArb, (originalLessons) => {
        const csv = lessonsToCSV(originalLessons, true);
        const result = parseScheduleCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.lessons).toHaveLength(originalLessons.length);

        for (let i = 0; i < originalLessons.length; i += 1) {
          const original = originalLessons[i];
          const parsed = result.lessons[i];

          expect(parsed.dayOfWeek).toBe(original.dayOfWeek);
          expect(parsed.startTime).toBe(original.startTime);
          expect(parsed.endTime).toBe(original.endTime);
          expect(parsed.subject).toBe(original.subject);
          expect(parsed.teacher).toBe(original.teacher);
          expect(parsed.group).toBe(original.group);
          expect(parsed.classroom).toBe(original.classroom);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 11: CSV Field Escaping Is Correct**
   * **Validates: Requirements 7.2**
   */
  it('property 11: should escape fields with commas or quotes and restore values', () => {
    const escapableFieldArb = fc.string({ minLength: 1, maxLength: 30 })
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => /[",]/.test(value))
      .filter((value) => !/[\n\r]/.test(value));

    fc.assert(
      fc.property(escapableFieldArb, safeStringArb, safeStringArb, (subject, teacher, group) => {
        const lesson: Lesson = {
          id: 'lesson-1',
          dayOfWeek: 'Понеділок',
          startTime: '09:00',
          endTime: '10:30',
          subject,
          teacher,
          group,
          classroom: '101',
        };

        const csv = lessonsToCSV([lesson], true);
        const result = parseScheduleCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.lessons).toHaveLength(1);
        expect(result.lessons[0].subject).toBe(subject);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 12: Empty Lessons Are Filtered**
   * **Validates: Requirements 6.5**
   */
  it('property 12: should filter rows with empty subject and teacher', () => {
    fc.assert(
      fc.property(groupNameArb, timeArb, (groupName, time) => {
        const csv = buildVerticalCsv([
          ...buildVerticalHeader(groupName),
          'Понеділок',
          `${time}-${time},,,`,
        ]);

        const result = parseScheduleCSV(csv);

        expect(result.errors).toHaveLength(0);
        expect(result.lessons).toHaveLength(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  describe('Unit tests: error handling and edge cases', () => {
    it('should filter #ERROR and #REF cells', () => {
      const csv = buildVerticalCsv([
        ...buildVerticalHeader('КН-21'),
        'Понеділок',
        '09:00-10:30,#ERROR,Петров,101',
        '10:40-12:10,#REF,Іванов,102',
      ]);

      const result = parseScheduleCSV(csv);

      expect(result.errors).toHaveLength(0);
      expect(result.lessons).toHaveLength(0);
    });

    it('should handle null input', () => {
      const result = parseScheduleCSV(null as unknown as string);
      expect(result.lessons).toHaveLength(0);
      expect(result.errors[0]?.message).toBe('Invalid CSV input');
    });

    it('should handle undefined input', () => {
      const result = parseScheduleCSV(undefined as unknown as string);
      expect(result.lessons).toHaveLength(0);
      expect(result.errors[0]?.message).toBe('Invalid CSV input');
    });

    it('should return an error for insufficient rows', () => {
      const result = parseScheduleCSV('foo,bar');
      expect(result.lessons).toHaveLength(0);
      expect(result.errors[0]?.message).toBe('Not enough data rows');
    });

    it('should detect a header row with "час" in the first column', () => {
      const csv = buildVerticalCsv([
        ...buildVerticalHeader('КН-21'),
        'Понеділок',
        '09:00-10:30,Математика,Іванов,101',
      ]);

      const result = parseScheduleCSV(csv);

      expect(result.errors).toHaveLength(0);
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].group).toBe('КН-21');
    });
  });

  describe('Integration tests: vertical format parsing', () => {
    it('should parse a realistic schedule with metadata', () => {
      const csv = buildVerticalCsv([
        '2 семестр 2024-2025 н.р.',
        '1 тиждень онлайн',
        'Час,КН-21,, ,КН-22,,',
        ',Предмет,Викладач,Аудиторія,Предмет,Викладач,Аудиторія',
        'Понеділок',
        '09:00-10:30,Математика,Іванов,101,Фізика,Петров,202',
        '10:40-12:10,Алгебра,Сидоренко,103,Хімія,Коваленко,204',
      ]);

      const result = parseScheduleCSV(csv);

      expect(result.errors).toHaveLength(0);
      expect(result.lessons).toHaveLength(4);
      expect(result.metadata?.currentWeek).toBe(1);
      expect(result.metadata?.defaultFormat).toBe('онлайн');
      expect(result.metadata?.semester).toBe('2 семестр 2024-2025 н.р.');

      const firstLesson = result.lessons[0];
      expect(firstLesson.dayOfWeek).toBe('Понеділок');
      expect(firstLesson.startTime).toBe('09:00');
      expect(firstLesson.endTime).toBe('10:30');
      expect(firstLesson.group).toBe('КН-21');
    });

    it('should reuse Monday time slots for other days', () => {
      const csv = buildVerticalCsv([
        ...buildVerticalHeader('КН-21'),
        'Понеділок',
        '09:00-10:30,Математика,Іванов,101',
        '10:40-12:10,Алгебра,Сидоренко,103',
        'Вівторок',
        ',Фізика,Петров,202',
        ',Хімія,Коваленко,204',
      ]);

      const result = parseScheduleCSV(csv);

      expect(result.errors).toHaveLength(0);
      expect(result.lessons).toHaveLength(4);

      const tuesdayLessons = result.lessons.filter((lesson) => lesson.dayOfWeek === 'Вівторок');
      expect(tuesdayLessons).toHaveLength(2);
      expect(tuesdayLessons[0].startTime).toBe('09:00');
      expect(tuesdayLessons[0].endTime).toBe('10:30');
      expect(tuesdayLessons[1].startTime).toBe('10:40');
      expect(tuesdayLessons[1].endTime).toBe('12:10');
    });
  });
});
