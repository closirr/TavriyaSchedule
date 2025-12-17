/**
 * CSV Parser Property Tests
 * 
 * Property-based tests for the CSV parser module using fast-check.
 * Tests validate parsing correctness and error handling.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseScheduleCSV, lessonsToCSV } from '../csv-parser';
import type { Lesson, DayOfWeek } from '../../types/schedule';
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
 * Generator for non-empty strings without problematic characters
 * Avoids newlines, commas, quotes, and ensures at least one non-whitespace character
 */
const safeStringArb = fc.stringOf(
  fc.char().filter(c => c !== '\n' && c !== '\r' && c !== ',' && c !== '"'),
  { minLength: 1, maxLength: 50 }
)
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

/**
 * Generator for valid lesson objects (without ID)
 */
const lessonDataArb = fc.record({
  dayOfWeek: dayOfWeekArb,
  startTime: timeArb,
  endTime: timeArb,
  subject: safeStringArb,
  teacher: safeStringArb,
  group: safeStringArb,
  classroom: safeStringArb,
});

/**
 * Generator for valid lesson with ID
 */
const lessonArb = lessonDataArb.chain((data) =>
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
 * **Feature: static-site-migration, Property 1: CSV Parsing Round Trip**
 * **Validates: Requirements 1.2**
 * 
 * For any valid array of lessons, serializing to CSV format and then parsing back
 * should produce an equivalent array of lessons (with the same data, though IDs may differ).
 */
describe('CSV Parser', () => {
  describe('Property 1: CSV Parsing Round Trip', () => {
    it('should preserve lesson data through CSV serialization and parsing', () => {
      fc.assert(
        fc.property(lessonsArb, (originalLessons) => {
          // Serialize lessons to CSV
          const csv = lessonsToCSV(originalLessons, true);
          
          // Parse the CSV back
          const result = parseScheduleCSV(csv);
          
          // Should have no errors for valid data
          expect(result.errors).toHaveLength(0);
          
          // Should have the same number of lessons
          expect(result.lessons).toHaveLength(originalLessons.length);
          
          // Each lesson should have equivalent data (ignoring ID which is regenerated)
          for (let i = 0; i < originalLessons.length; i++) {
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

    it('should handle empty lesson arrays', () => {
      const csv = lessonsToCSV([], true);
      const result = parseScheduleCSV(csv);
      
      expect(result.lessons).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV without header', () => {
      fc.assert(
        fc.property(lessonsArb.filter(l => l.length > 0), (originalLessons) => {
          // Serialize without header
          const csv = lessonsToCSV(originalLessons, false);
          
          // Parse should still work (auto-detect no header)
          const result = parseScheduleCSV(csv);
          
          // Should parse all lessons
          expect(result.lessons.length).toBe(originalLessons.length);
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });


  /**
   * **Feature: static-site-migration, Property 2: Invalid Row Filtering**
   * **Validates: Requirements 1.3, 1.5**
   * 
   * For any CSV string containing a mix of valid and invalid rows, parsing should
   * return only lessons from valid rows, and the count of returned lessons plus
   * the count of parse errors should equal the total row count.
   */
  describe('Property 2: Invalid Row Filtering', () => {
    /**
     * Generator for invalid day of week
     */
    const invalidDayArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => !DAYS_OF_WEEK.includes(s as DayOfWeek) && s.trim().length > 0);

    /**
     * Generator for invalid time format
     * These are strings that will definitely fail the time regex validation
     */
    const invalidTimeArb = fc.constantFrom(
      '25:00',
      '12:60',
      'abc',
      '1200',
      '12-00',
      'noon',
      '',
    );

    /**
     * Generator for empty/whitespace-only strings
     */
    const emptyStringArb = fc.constantFrom('', '   ', '\t');

    /**
     * Generator for a valid CSV row
     */
    const validRowArb = lessonDataArb.map(lesson => 
      [
        lesson.dayOfWeek,
        lesson.startTime,
        lesson.endTime,
        lesson.subject,
        lesson.teacher,
        lesson.group,
        lesson.classroom,
      ].join(',')
    );

    /**
     * Generator for an invalid CSV row (various types of invalidity)
     * Each type of invalid row is guaranteed to fail validation
     */
    const invalidRowArb = fc.oneof(
      // Invalid day of week - use a constant that's definitely not a valid day
      fc.tuple(
        fc.constantFrom('InvalidDay', 'Monday', 'Sunday', 'Неділя'),
        timeArb, timeArb, safeStringArb, safeStringArb, safeStringArb, safeStringArb
      ).map(fields => fields.join(',')),
      // Invalid start time
      fc.tuple(
        dayOfWeekArb, invalidTimeArb, timeArb, safeStringArb, safeStringArb, safeStringArb, safeStringArb
      ).map(fields => fields.join(',')),
      // Empty subject (empty string between commas)
      fc.tuple(dayOfWeekArb, timeArb, timeArb, safeStringArb, safeStringArb, safeStringArb)
        .map(([day, start, end, teacher, group, classroom]) => 
          `${day},${start},${end},,${teacher},${group},${classroom}`),
      // Too few fields (only 3 fields)
      fc.tuple(dayOfWeekArb, timeArb, timeArb)
        .map(fields => fields.join(',')),
    );

    /**
     * Generator for mixed CSV with both valid and invalid rows
     */
    const mixedRowsArb = fc.tuple(
      fc.array(validRowArb, { minLength: 0, maxLength: 20 }),
      fc.array(invalidRowArb, { minLength: 0, maxLength: 20 })
    ).chain(([validRows, invalidRows]) => {
      // Shuffle the rows together
      const allRows = [...validRows.map(r => ({ row: r, valid: true })), 
                       ...invalidRows.map(r => ({ row: r, valid: false }))];
      return fc.shuffledSubarray(allRows, { minLength: allRows.length, maxLength: allRows.length })
        .map(shuffled => ({
          rows: shuffled,
          expectedValidCount: validRows.length,
          expectedInvalidCount: invalidRows.length,
        }));
    });

    it('should count valid lessons plus errors equal total data rows', () => {
      fc.assert(
        fc.property(mixedRowsArb, ({ rows, expectedValidCount, expectedInvalidCount }) => {
          // Build CSV with header
          const header = 'День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория';
          const csvLines = [header, ...rows.map(r => r.row)];
          const csv = csvLines.join('\n');
          
          const result = parseScheduleCSV(csv);
          
          // Total data rows (excluding header)
          const totalDataRows = rows.length;
          
          // Lessons + errors should equal total data rows
          const totalProcessed = result.lessons.length + result.errors.length;
          expect(totalProcessed).toBe(totalDataRows);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should only return valid lessons from mixed input', () => {
      fc.assert(
        fc.property(mixedRowsArb, ({ rows }) => {
          const header = 'День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория';
          const csvLines = [header, ...rows.map(r => r.row)];
          const csv = csvLines.join('\n');
          
          const result = parseScheduleCSV(csv);
          
          // All returned lessons should be valid (have required fields)
          for (const lesson of result.lessons) {
            expect(DAYS_OF_WEEK).toContain(lesson.dayOfWeek);
            expect(lesson.startTime).toMatch(/^\d{2}:\d{2}$/);
            expect(lesson.endTime).toMatch(/^\d{2}:\d{2}$/);
            expect(lesson.subject.trim().length).toBeGreaterThan(0);
            expect(lesson.teacher.trim().length).toBeGreaterThan(0);
            expect(lesson.group.trim().length).toBeGreaterThan(0);
            expect(lesson.classroom.trim().length).toBeGreaterThan(0);
          }
          
          // The key property: lessons + errors = total rows
          // (already tested in another property, but validates consistency)
          expect(result.lessons.length + result.errors.length).toBe(rows.length);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should report errors for invalid rows with row numbers', () => {
      fc.assert(
        fc.property(
          fc.array(invalidRowArb, { minLength: 1, maxLength: 10 }),
          (invalidRows) => {
            const header = 'День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория';
            const csv = [header, ...invalidRows].join('\n');
            
            const result = parseScheduleCSV(csv);
            
            // Should have no valid lessons from invalid rows
            expect(result.lessons.length).toBe(0);
            
            // Should have at least one error (all rows are invalid)
            expect(result.errors.length).toBeGreaterThan(0);
            
            // Total processed should equal input rows
            expect(result.lessons.length + result.errors.length).toBe(invalidRows.length);
            
            // Each error should have a valid row number (1-indexed, after header)
            for (const error of result.errors) {
              expect(error.row).toBeGreaterThan(1); // After header
              expect(error.message.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Unit Tests', () => {
    it('should handle null input', () => {
      const result = parseScheduleCSV(null as any);
      expect(result.lessons).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined input', () => {
      const result = parseScheduleCSV(undefined as any);
      expect(result.lessons).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty string gracefully', () => {
      const result = parseScheduleCSV('');
      expect(result.lessons).toHaveLength(0);
      // Empty input may or may not produce an error depending on implementation
      // The key is that no lessons are returned
    });

    it('should handle CSV with only header', () => {
      const csv = 'День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория';
      const result = parseScheduleCSV(csv);
      expect(result.lessons).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse a valid single row', () => {
      const csv = `День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория
Понедельник,09:00,10:30,Математика,Іванов І.І.,КН-21,101`;
      
      const result = parseScheduleCSV(csv);
      
      expect(result.lessons).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.lessons[0].dayOfWeek).toBe('Понедельник');
      expect(result.lessons[0].subject).toBe('Математика');
    });

    it('should handle quoted fields with commas', () => {
      const csv = `День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория
Понедельник,09:00,10:30,"Математика, вища",Іванов І.І.,КН-21,101`;
      
      const result = parseScheduleCSV(csv);
      
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].subject).toBe('Математика, вища');
    });

    it('should normalize single-digit hours', () => {
      const csv = `День недели,Время начала,Время окончания,Предмет,Преподаватель,Группа,Аудитория
Понедельник,9:00,10:30,Математика,Іванов І.І.,КН-21,101`;
      
      const result = parseScheduleCSV(csv);
      
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].startTime).toBe('09:00');
    });
  });
});
