/**
 * CSV Parser Module v2.0 - Vertical Format
 * 
 * Parses CSV data from Google Sheets vertical format into Lesson objects.
 * Handles the specific format: groups in columns, days as row separators.
 */

console.log('[CSV-PARSER] Version 2.0 loaded - Vertical format parser');

import type { Lesson, ParseResult, DayOfWeek } from '../types/schedule';
import { DAY_NAME_MAP } from '../types/schedule';

/**
 * Parses a single CSV line, handling quoted fields correctly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Checks if a cell contains a day of week
 */
function isDayOfWeek(cell: string): DayOfWeek | null {
  const upper = cell.toUpperCase().trim();
  return DAY_NAME_MAP[upper] || null;
}


/**
 * Parses time range like "9:00-10:20" into start and end times
 */
function parseTimeRange(timeStr: string): { startTime: string; endTime: string } | null {
  const match = timeStr.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
  if (!match) return null;
  
  const normalizeTime = (t: string) => {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  };
  
  return {
    startTime: normalizeTime(match[1]),
    endTime: normalizeTime(match[2]),
  };
}

/**
 * Structure to hold group info from header
 */
interface GroupColumn {
  groupName: string;
  subjectCol: number;
  teacherCol: number;
  classroomCol: number;
}

/**
 * Parses header row to extract group columns
 */
function parseGroupHeaders(headerRow: string[]): GroupColumn[] {
  const groups: GroupColumn[] = [];
  const skipWords = ['час', 'предмет', 'викладач', 'аудиторія', 'аудиторiя', ''];
  
  for (let i = 1; i < headerRow.length; i++) {
    const cell = headerRow[i].trim();
    if (cell && !skipWords.includes(cell.toLowerCase())) {
      groups.push({
        groupName: cell,
        subjectCol: i,
        teacherCol: i + 1,
        classroomCol: i + 2,
      });
    }
  }
  
  return groups;
}

/**
 * Parses CSV data from Google Sheets vertical format.
 */
export function parseScheduleCSV(csv: string): ParseResult {
  const lessons: Lesson[] = [];
  const errors: ParseError[] = [];
  
  if (!csv || typeof csv !== 'string') {
    return { lessons: [], errors: [{ row: 0, message: 'Invalid CSV input' }] };
  }
  
  const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 3) {
    return { lessons: [], errors: [{ row: 0, message: 'Not enough data rows' }] };
  }
  
  let currentGroups: GroupColumn[] = [];
  let currentDay: DayOfWeek | null = null;
  let lessonIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length === 0) continue;
    
    const firstCell = fields[0].trim();
    
    // Skip title rows
    if (firstCell.toUpperCase().includes('РОЗКЛАД')) continue;
    
    // Check for header row with group names
    if (firstCell.toLowerCase() === 'час' || 
        (fields.some(f => f.toLowerCase() === 'предмет') && fields.some(f => f.toLowerCase() === 'викладач'))) {
      currentGroups = parseGroupHeaders(fields);
      // Skip subheader row
      if (i + 1 < lines.length) {
        const nextRow = parseCSVLine(lines[i + 1]);
        if (nextRow.some(f => f.toLowerCase() === 'предмет' || f.toLowerCase() === 'викладач')) {
          i++;
        }
      }
      continue;
    }
    
    // Check for day of week
    const dayMatch = isDayOfWeek(firstCell);
    if (dayMatch) {
      currentDay = dayMatch;
      continue;
    }
    
    // Check day in any field
    for (const field of fields) {
      const dayInField = isDayOfWeek(field);
      if (dayInField) {
        currentDay = dayInField;
        break;
      }
    }
    
    // Parse lesson row
    const timeRange = parseTimeRange(firstCell);
    if (!timeRange || !currentDay || currentGroups.length === 0) continue;
    
    for (const group of currentGroups) {
      const subject = fields[group.subjectCol]?.trim() || '';
      const teacher = fields[group.teacherCol]?.trim() || '';
      const classroom = fields[group.classroomCol]?.trim() || '';
      
      if (!subject && !teacher && !classroom) continue;
      if (subject.includes('#ERROR') || subject.includes('#REF')) continue;
      
      if (subject || teacher) {
        lessons.push({
          id: `lesson-${lessonIndex++}`,
          dayOfWeek: currentDay,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
          subject: subject || 'Невідомий предмет',
          teacher: teacher || 'Невідомий викладач',
          group: group.groupName,
          classroom: classroom || '-',
        });
      }
    }
  }
  
  return { lessons, errors };
}

/**
 * Serializes lessons back to CSV format
 */
export function lessonsToCSV(lessons: Lesson[], includeHeader: boolean = true): string {
  const rows: string[] = [];
  
  if (includeHeader) {
    rows.push('День,Час початку,Час закінчення,Предмет,Викладач,Група,Аудиторія');
  }
  
  for (const lesson of lessons) {
    rows.push([
      escapeCSVField(lesson.dayOfWeek),
      escapeCSVField(lesson.startTime),
      escapeCSVField(lesson.endTime),
      escapeCSVField(lesson.subject),
      escapeCSVField(lesson.teacher),
      escapeCSVField(lesson.group),
      escapeCSVField(lesson.classroom),
    ].join(','));
  }
  
  return rows.join('\n');
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
