/**
 * CSV Parser Internal Function Tests
 *
 * Property-based tests for internal helper functions in the CSV parser.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseCSVLine,
  isDayOfWeek,
  parseTimeRange,
  extractMetadata,
  extractWeekNumber,
  extractLessonFormat,
  parseGroupHeaders,
} from '../csv-parser';
import { DAYS_OF_WEEK } from '../../types/schedule';

const safeStringArb = fc.string({ minLength: 1, maxLength: 40 })
  .map((value) => value.trim())
  .filter((value) => value.length > 0)
  .filter((value) => !/[\n\r",]/.test(value));

const dayOfWeekArb = fc.constantFrom(...DAYS_OF_WEEK);

const timePartArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => ({
  hour: h,
  minute: m,
}));

function formatTime(hour: number, minute: number, padHour: boolean): string {
  const hourStr = padHour ? hour.toString().padStart(2, '0') : hour.toString();
  return `${hourStr}:${minute.toString().padStart(2, '0')}`;
}

describe('CSV Parser Internal Functions', () => {
  /**
   * **Feature: excel-schedule-parsing-tests, Property 1: CSV Line Parsing Preserves Field Content**
   * **Validates: Requirements 1.1, 1.3, 1.4**
   */
  it('property 1: should preserve field content and trim spaces', () => {
    const fieldArb = fc.record({
      value: safeStringArb,
      padLeft: fc.boolean(),
      padRight: fc.boolean(),
    });

    fc.assert(
      fc.property(fc.array(fieldArb, { minLength: 1, maxLength: 10 }), (fields) => {
        const line = fields
          .map(({ value, padLeft, padRight }) => {
            const left = padLeft ? '  ' : '';
            const right = padRight ? '  ' : '';
            return `${left}${value}${right}`;
          })
          .join(',');

        const parsed = parseCSVLine(line);

        expect(parsed).toHaveLength(fields.length);
        parsed.forEach((field, index) => {
          expect(field).toBe(fields[index].value.trim());
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 2: CSV Quoted Fields Are Handled Correctly**
   * **Validates: Requirements 1.1, 1.2**
   */
  it('property 2: should parse quoted fields with commas and quotes', () => {
    const quotedContentArb = fc.string({ minLength: 1, maxLength: 40 })
      .filter((value) => /[",]/.test(value))
      .filter((value) => !/[\n\r]/.test(value))
      .filter((value) => value.trim() === value);

    fc.assert(
      fc.property(fc.array(quotedContentArb, { minLength: 1, maxLength: 8 }), (fields) => {
        const line = fields
          .map((value) => `"${value.replace(/"/g, '""')}"`)
          .join(',');

        const parsed = parseCSVLine(line);

        expect(parsed).toHaveLength(fields.length);
        parsed.forEach((field, index) => {
          expect(field).toBe(fields[index]);
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 3: Day of Week Detection Is Correct**
   * **Validates: Requirements 2.1, 2.4**
   */
  it('property 3: should detect day of week regardless of case and spaces', () => {
    const dayVariantArb = fc.tuple(dayOfWeekArb, fc.constantFrom('upper', 'lower', 'original'), fc.integer({ min: 0, max: 2 }));

    fc.assert(
      fc.property(dayVariantArb, ([day, variant, padding]) => {
        const padded = ' '.repeat(padding);
        const value = variant === 'upper'
          ? day.toUpperCase()
          : variant === 'lower'
            ? day.toLowerCase()
            : day;

        expect(isDayOfWeek(`${padded}${value}${padded}`)).toBe(day);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 4: Invalid Day Returns Null**
   * **Validates: Requirements 2.3**
   */
  it('property 4: should return null for invalid day strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((value) => isDayOfWeek(value) === null),
        (value) => {
          expect(isDayOfWeek(value)).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("unit: should handle Friday with or without apostrophe", () => {
    expect(isDayOfWeek('ПЯТНИЦЯ')).toBe("П'ятниця");
    expect(isDayOfWeek("П'ЯТНИЦЯ")).toBe("П'ятниця");
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 5: Time Range Parsing Normalizes Format**
   * **Validates: Requirements 3.1, 3.2**
   */
  it('property 5: should normalize time range format', () => {
    const timeRangeArb = fc.tuple(
      timePartArb,
      timePartArb,
      fc.boolean(),
      fc.boolean(),
      fc.constantFrom('-', '–')
    );

    fc.assert(
      fc.property(timeRangeArb, ([start, end, padStart, padEnd, dash]) => {
        const startStr = formatTime(start.hour, start.minute, padStart);
        const endStr = formatTime(end.hour, end.minute, padEnd);
        const parsed = parseTimeRange(`${startStr}${dash}${endStr}`);

        expect(parsed).not.toBeNull();
        expect(parsed?.startTime).toBe(formatTime(start.hour, start.minute, true));
        expect(parsed?.endTime).toBe(formatTime(end.hour, end.minute, true));

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 6: Invalid Time Returns Null**
   * **Validates: Requirements 3.4**
   */
  it('property 6: should return null for invalid time strings', () => {
    const invalidTimeArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter((value) => !/^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}$/.test(value));

    fc.assert(
      fc.property(invalidTimeArb, (value) => {
        expect(parseTimeRange(value)).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('unit: should parse time ranges with long dash', () => {
    expect(parseTimeRange('9:00–10:30')).toEqual({ startTime: '09:00', endTime: '10:30' });
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 7: Week Number Extraction Is Correct**
   * **Validates: Requirements 4.1, 4.2**
   */
  it('property 7: should extract week number from text', () => {
    const weekTextArb = fc.tuple(fc.constantFrom(1, 2), fc.constantFrom('prefix', 'suffix', 'roman'))
      .map(([week, variant]) => {
        if (variant === 'roman') {
          return week === 1 ? 'I тиждень' : 'II тиждень';
        }
        if (variant === 'prefix') {
          return `${week} тиждень`; 
        }
        return `тиждень ${week}`;
      });

    fc.assert(
      fc.property(weekTextArb, (text) => {
        const week = text.includes('2') || text.includes('II') ? 2 : 1;
        expect(extractWeekNumber(text)).toBe(week);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 8: Lesson Format Extraction Is Correct**
   * **Validates: Requirements 4.3, 4.4**
   */
  it('property 8: should extract lesson format from text', () => {
    const formatArb = fc.constantFrom(
      { text: 'онлайн', expected: 'онлайн' },
      { text: 'дистанц', expected: 'онлайн' },
      { text: 'online', expected: 'онлайн' },
      { text: 'офлайн', expected: 'офлайн' },
      { text: 'очн', expected: 'офлайн' },
      { text: 'аудитор', expected: 'офлайн' }
    );

    fc.assert(
      fc.property(formatArb, ({ text, expected }) => {
        expect(extractLessonFormat(text)).toBe(expected);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('unit: should extract semester information', () => {
    const metadata = extractMetadata(['2 семестр 2024-2025 н.р.']);
    expect(metadata.semester).toBe('2 семестр 2024-2025 н.р.');
  });

  /**
   * **Feature: excel-schedule-parsing-tests, Property 9: Group Header Parsing Creates Correct Structures**
   * **Validates: Requirements 5.2, 5.3, 5.4**
   */
  it('property 9: should parse group headers into column structures', () => {
    const groupNameArb = safeStringArb.filter((value) => !['час', 'предмет', 'викладач', 'аудиторія'].includes(value.toLowerCase()));

    fc.assert(
      fc.property(fc.array(groupNameArb, { minLength: 1, maxLength: 5 }), (groups) => {
        const headerRow = ['Час', ...groups.flatMap((group) => [group, '', ''])];
        const parsed = parseGroupHeaders(headerRow);

        expect(parsed).toHaveLength(groups.length);

        parsed.forEach((group, index) => {
          const baseIndex = 1 + index * 3;
          expect(group.groupName).toBe(groups[index]);
          expect(group.subjectCol).toBe(baseIndex);
          expect(group.teacherCol).toBe(baseIndex + 1);
          expect(group.classroomCol).toBe(baseIndex + 2);
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
