/**
 * CSV Parser Module v2.0 - Vertical Format
 * 
 * Parses CSV data from Google Sheets vertical format into Lesson objects.
 * Handles the specific format: groups in columns, days as row separators.
 */

console.log('[CSV-PARSER] Version 2.0 loaded - Vertical format parser');

import type { Lesson, ParseResult, DayOfWeek, ScheduleMetadata, WeekNumber, LessonFormat, ParseError } from '../types/schedule';
import { DAY_NAME_MAP } from '../types/schedule';

/**
 * Splits raw CSV text into rows while respecting quoted newlines.
 */
function splitCsvIntoRows(csv: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      // Preserve quotes for downstream parsing
      if (inQuotes && next === '"') {
        current += '""';
        i++; // Skip escaped quote
      } else {
        current += '"';
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === '\r') {
      // Skip carriage returns; handle newline in next iteration if present
      continue;
    }

    if (char === '\n' && !inQuotes) {
      rows.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

/**
 * Parses a single CSV line, handling quoted fields correctly
 */
export function parseCSVLine(line: string): string[] {
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
export function isDayOfWeek(cell: string): DayOfWeek | null {
  const upper = cell.toUpperCase().trim();
  return DAY_NAME_MAP[upper] || null;
}

/**
 * Extracts week number from text (e.g., "1 тиждень", "2-й тиждень", "тиждень 1", "перший тиждень", "другий тиждень")
 */
export function extractWeekNumber(text: string): WeekNumber | null {
  const normalized = text.toLowerCase().trim();
  
  // Match patterns like "1 тиждень", "1-й тиждень", "тиждень 1", "I тиждень", "II тиждень", "перший тиждень"
  if (/(?:^|\s)1[-\s]?(?:й\s+)?тиждень|тиждень\s*1|^i\s+тиждень|перший\s+тиждень|непарний\s+тиждень/i.test(normalized)) {
    return 1;
  }
  if (/(?:^|\s)2[-\s]?(?:й\s+)?тиждень|тиждень\s*2|^ii\s+тиждень|другий\s+тиждень|парний\s+тиждень/i.test(normalized)) {
    return 2;
  }
  
  return null;
}

/**
 * Extracts lesson format from text (online/offline)
 */
export function extractLessonFormat(text: string): LessonFormat | null {
  const normalized = text.toLowerCase().trim();
  
  // Skip header text that contains both options like "онлайн або оффлайн"
  if (/онлайн\s+(або|чи|\/)\s+оф{1,2}лайн/i.test(normalized) || 
      /оф{1,2}лайн\s+(або|чи|\/)\s+онлайн/i.test(normalized)) {
    return null;
  }
  
  // Check for offline first (more specific patterns)
  if (/оф{1,2}лайн|offline|очн|аудитор/i.test(normalized)) {
    return 'офлайн';
  }
  // Then check for online
  if (/онлайн|online|дистанц/i.test(normalized)) {
    return 'онлайн';
  }
  
  return null;
}

/**
 * Removes week labels (e.g., "1 тиждень") from a cell value
 */
function stripWeekMarkers(value: string): string {
  if (!value) return '';
  return value
    .replace(/(?:^|\s)(?:1|2|i{1,2})\s*[-–.]?\s*тиждень[:\-]?\s*/gi, '')
    .trim();
}

/**
 * Splits a cell value into week-based alternatives (for "мигалка")
 * Supports "/" as separator between 1-й та 2-й варіантами.
 * Empty sides are allowed (e.g., "Предмет/" або "/ Викладач").
 */
function splitAlternatingValues(value: string): [string, string] | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  // Explicit "1 тиждень ... / 2 тиждень ..." pattern
  const explicitMatch = normalized.match(/(?:1|i)\s*[-–.]?\s*тиждень[:\-]?\s*(.*?)\/\s*(?:2|ii)\s*[-–.]?\s*тиждень[:\-]?\s*(.*)/i);
  if (explicitMatch) {
    console.log(`[CSV-PARSER] splitAlternatingValues explicit match: "${value}" -> ["${explicitMatch[1]}", "${explicitMatch[2]}"]`);
    return [explicitMatch[1]?.trim() ?? '', explicitMatch[2]?.trim() ?? ''];
  }

  // Split by "/"
  if (normalized.includes('/')) {
    const parts = normalized.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      console.log(`[CSV-PARSER] splitAlternatingValues "/" split: "${value}" -> ["${parts[0]}", "${parts[1]}"]`);
      return [parts[0] ?? '', parts[1] ?? ''];
    }
  }

  return null;
}

/**
 * Extracts metadata from CSV header rows
 * Week number is read from cell E3 (row 3, column E) - manual override
 */
export function extractMetadata(lines: string[]): ScheduleMetadata {
  const metadata: ScheduleMetadata = {};
  
  // Debug: log first 5 rows to see structure
  console.log('[CSV-PARSER] First 5 rows for metadata:');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const fields = parseCSVLine(lines[i]);
    console.log(`  Row ${i + 1}:`, fields.slice(0, 8));
  }
  
  // Search for week value in first 5 rows, column E (index 4) or nearby
  for (let rowIdx = 0; rowIdx < Math.min(5, lines.length); rowIdx++) {
    const fields = parseCSVLine(lines[rowIdx]);
    
    // Check columns D, E, F, G (indices 3, 4, 5, 6) for week value
    for (let colIdx = 3; colIdx <= 6; colIdx++) {
      const cell = fields[colIdx]?.trim() || '';
      if (!cell) continue;
      
      const cellLower = cell.toLowerCase();
      console.log(`[CSV-PARSER] Checking cell [${rowIdx + 1}, ${colIdx + 1}]: "${cell}" -> "${cellLower}"`);
      
      if (cellLower === 'перший' || cellLower === '1' || cellLower === 'i' || cellLower === 'непарний' || cellLower === 'перша') {
        metadata.currentWeek = 1;
        console.log(`[CSV-PARSER] Week found: 1 ("${cell}" at row ${rowIdx + 1}, col ${colIdx + 1})`);
        break;
      } else if (cellLower === 'другий' || cellLower === '2' || cellLower === 'ii' || cellLower === 'парний' || cellLower === 'друга') {
        metadata.currentWeek = 2;
        console.log(`[CSV-PARSER] Week found: 2 ("${cell}" at row ${rowIdx + 1}, col ${colIdx + 1})`);
        break;
      }
    }
    if (metadata.currentWeek) break;
  }
  
  // Check header lines for other metadata (format, semester)
  const headerLines = lines.slice(0, 10);
  
  for (const line of headerLines) {
    const fields = parseCSVLine(line);
    const fullLine = fields.join(' ');
    
    // Extract format
    if (!metadata.defaultFormat) {
      const format = extractLessonFormat(fullLine);
      if (format) {
        metadata.defaultFormat = format;
      }
    }
    
    // Extract semester info
    if (!metadata.semester && /семестр|н\.?\s*р\.?|навч/i.test(fullLine)) {
      const semesterMatch = fullLine.match(/(\d\s*семестр\s*\d{4}[-–]\d{4}\s*н\.?\s*р\.?)/i);
      if (semesterMatch) {
        metadata.semester = semesterMatch[1];
      }
    }
  }
  
  return metadata;
}


/**
 * Parses time range like "9:00-10:20" or "1) 9:00-10:20" into start and end times
 * Ignores lesson number prefix (e.g., "1)", "2)", etc.)
 */
export function parseTimeRange(timeStr: string): { startTime: string; endTime: string } | null {
  // Match time with optional lesson number prefix like "1) ", "2) ", etc.
  const match = timeStr.match(/^(?:\d+\)\s*)?(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
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
export function parseGroupHeaders(headerRow: string[]): GroupColumn[] {
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

type FlatHeaderMap = {
  day: number;
  startTime: number;
  endTime: number;
  subject: number;
  teacher: number;
  group: number;
  classroom: number;
};

function detectFlatHeader(headerRow: string[]): FlatHeaderMap | null {
  const normalized = headerRow.map((value) => value.trim().toLowerCase());

  const indexOf = (options: string[]) => normalized.findIndex((value) => options.includes(value));

  const day = indexOf(['день', 'день недели', 'день тижня']);
  const startTime = indexOf(['час початку', 'время начала', 'час начала']);
  const endTime = indexOf(['час закінчення', 'время окончания', 'час окончания']);
  const subject = indexOf(['предмет']);
  const teacher = indexOf(['викладач', 'преподаватель']);
  const group = indexOf(['група', 'группа']);
  const classroom = indexOf(['аудиторія', 'аудитория']);

  if ([day, startTime, endTime, subject, teacher, group, classroom].some((idx) => idx === -1)) {
    return null;
  }

  return { day, startTime, endTime, subject, teacher, group, classroom };
}

function parseFlatScheduleCSV(lines: string[], headerMap: FlatHeaderMap): ParseResult {
  const lessons: Lesson[] = [];
  const errors: ParseError[] = [];
  let lessonIndex = 0;

  const normalizeTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length === 0 || fields.every((field) => field.trim().length === 0)) continue;

    const dayCell = fields[headerMap.day]?.trim() || '';
    const dayOfWeek = isDayOfWeek(dayCell);
    if (!dayOfWeek) continue;

    const startTimeRaw = fields[headerMap.startTime]?.trim() || '';
    const endTimeRaw = fields[headerMap.endTime]?.trim() || '';

    if (!/^\d{1,2}:\d{2}$/.test(startTimeRaw) || !/^\d{1,2}:\d{2}$/.test(endTimeRaw)) {
      continue;
    }

    const subject = fields[headerMap.subject]?.trim() || '';
    const teacher = fields[headerMap.teacher]?.trim() || '';
    const group = fields[headerMap.group]?.trim() || '';
    const classroom = fields[headerMap.classroom]?.trim() || '';

    if (!subject && !teacher && !classroom) continue;

    lessons.push({
      id: `lesson-${lessonIndex++}`,
      dayOfWeek,
      startTime: normalizeTime(startTimeRaw),
      endTime: normalizeTime(endTimeRaw),
      subject,
      teacher,
      group,
      classroom,
    });
  }

  return { lessons, errors };
}

/**
 * Checks if a value represents "no lesson" (empty, dash, etc.)
 */
function isEmptyLesson(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === '-' || normalized === '—' || normalized === '–';
}

/**
 * Builds lesson variants for a cell that may contain alternating week content.
 * Returns one or two lessons with explicit weekNumber when applicable.
 * 
 * Logic:
 * - If both weeks have content: create 2 lessons with weekNumber 1 and 2
 * - If only one week has content (other is "-" or empty): create 1 lesson with that weekNumber
 * - If no alternation: create 1 lesson without weekNumber
 */
function buildLessonVariants(
  subject: string,
  teacher: string,
  classroom: string
): Array<{ subject: string; teacher: string; classroom: string; weekNumber?: WeekNumber }> {
  const subjectAlternatives = splitAlternatingValues(subject);
  const teacherAlternatives = splitAlternatingValues(teacher);
  const classroomAlternatives = splitAlternatingValues(classroom);

  // If any field has two alternatives – treat as alternating weeks
  if (subjectAlternatives || teacherAlternatives || classroomAlternatives) {
    const [subject1, subject2] = subjectAlternatives ?? [subject, subject];
    const [teacher1, teacher2] = teacherAlternatives ?? [teacher, teacher];
    const [classroom1, classroom2] = classroomAlternatives ?? [classroom, classroom];

    const cleanSubject1 = stripWeekMarkers(subject1);
    const cleanSubject2 = stripWeekMarkers(subject2);
    const cleanTeacher1 = stripWeekMarkers(teacher1);
    const cleanTeacher2 = stripWeekMarkers(teacher2);
    const cleanClassroom1 = stripWeekMarkers(classroom1);
    const cleanClassroom2 = stripWeekMarkers(classroom2);

    const isEmpty1 = isEmptyLesson(cleanSubject1) && isEmptyLesson(cleanTeacher1);
    const isEmpty2 = isEmptyLesson(cleanSubject2) && isEmptyLesson(cleanTeacher2);



    // If both are empty, don't create any lessons
    if (isEmpty1 && isEmpty2) {
      return [];
    }

    const result: Array<{ subject: string; teacher: string; classroom: string; weekNumber?: WeekNumber }> = [];

    // Create lesson for week 1 only if it has content
    if (!isEmpty1) {
      result.push({
        subject: cleanSubject1 || 'Невідомий предмет',
        teacher: cleanTeacher1 || 'Невідомий викладач',
        classroom: cleanClassroom1 || '-',
        weekNumber: 1 as WeekNumber,
      });
    }

    // Create lesson for week 2 only if it has content
    if (!isEmpty2) {
      result.push({
        subject: cleanSubject2 || 'Невідомий предмет',
        teacher: cleanTeacher2 || 'Невідомий викладач',
        classroom: cleanClassroom2 || '-',
        weekNumber: 2 as WeekNumber,
      });
    }
    
    return result;
  }

  // No explicit alternation – check if the text contains a single week marker
  const explicitWeek =
    extractWeekNumber(subject) ||
    extractWeekNumber(teacher) ||
    extractWeekNumber(classroom) ||
    null;

  return [{
    subject: stripWeekMarkers(subject) || 'Невідомий предмет',
    teacher: stripWeekMarkers(teacher) || 'Невідомий викладач',
    classroom: stripWeekMarkers(classroom) || '-',
    weekNumber: explicitWeek || undefined,
  }];
}

/**
 * Parses CSV data from Google Sheets vertical format.
 * Time slots are extracted from Monday (first day) and reused for all other days.
 */
export function parseScheduleCSV(csv: string): ParseResult {
  const lessons: Lesson[] = [];
  const errors: ParseError[] = [];
  
  if (!csv || typeof csv !== 'string') {
    return { lessons: [], errors: [{ row: 0, message: 'Invalid CSV input' }] };
  }
  
  const lines = splitCsvIntoRows(csv).filter(line => line.trim().length > 0);
  const headerFields = lines.length > 0 ? parseCSVLine(lines[0]) : [];
  const flatHeader = detectFlatHeader(headerFields);
  
  if (lines.length < 3 && !flatHeader) {
    return { lessons: [], errors: [{ row: 0, message: 'Not enough data rows' }] };
  }

  if (flatHeader) {
    return parseFlatScheduleCSV(lines, flatHeader);
  }
  
  // Extract metadata from header rows
  const metadata = extractMetadata(lines);
  
  let currentGroups: GroupColumn[] = [];
  let currentDay: DayOfWeek | null = null;
  let lessonIndex = 0;
  
  // Time slots extracted from Monday (first day) - reused for all days
  const timeSlots: { startTime: string; endTime: string }[] = [];
  let isFirstDay = true;
  let currentLessonInDay = 0;
  
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
      // If we're moving past Monday, mark that we've collected time slots
      if (currentDay === 'Понеділок' && dayMatch !== 'Понеділок') {
        isFirstDay = false;
      }
      currentDay = dayMatch;
      currentLessonInDay = 0; // Reset lesson counter for new day
      continue;
    }
    
    // Check day in any field
    for (const field of fields) {
      const dayInField = isDayOfWeek(field);
      if (dayInField) {
        if (currentDay === 'Понеділок' && dayInField !== 'Понеділок') {
          isFirstDay = false;
        }
        currentDay = dayInField;
        currentLessonInDay = 0;
        break;
      }
    }
    
    if (!currentDay || currentGroups.length === 0) continue;
    
    // Try to parse time from first cell
    const timeRange = parseTimeRange(firstCell);
    
    // Determine the time slot to use
    let effectiveTimeRange: { startTime: string; endTime: string } | null = null;
    
    if (timeRange) {
      // We have explicit time in this row
      effectiveTimeRange = timeRange;
      
      // If this is Monday (first day), collect time slots
      if (isFirstDay && currentDay === 'Понеділок') {
        // Only add if not already in the list
        const exists = timeSlots.some(
          ts => ts.startTime === timeRange.startTime && ts.endTime === timeRange.endTime
        );
        if (!exists) {
          timeSlots.push(timeRange);
        }
      }
    } else if (!isFirstDay && timeSlots.length > 0) {
      // No time in this row, but we have collected time slots from Monday
      // Check if this row has lesson data (not empty)
      const hasLessonData = currentGroups.some(group => {
        const subject = fields[group.subjectCol]?.trim() || '';
        const teacher = fields[group.teacherCol]?.trim() || '';
        return subject || teacher;
      });
      
      if (hasLessonData && currentLessonInDay < timeSlots.length) {
        effectiveTimeRange = timeSlots[currentLessonInDay];
        currentLessonInDay++;
      }
    }
    
    // If we still don't have a time range, skip this row
    if (!effectiveTimeRange) {
      // But if we have time, increment the counter for Monday
      if (timeRange && isFirstDay) {
        currentLessonInDay++;
      }
      continue;
    }
    
    // If we used time from the row (not from slots), increment counter
    if (timeRange) {
      currentLessonInDay++;
    }
    
    for (const group of currentGroups) {
      const subject = fields[group.subjectCol]?.trim() || '';
      const teacher = fields[group.teacherCol]?.trim() || '';
      const classroom = fields[group.classroomCol]?.trim() || '';
      
      if (!subject && !teacher && !classroom) continue;
      if (subject.includes('#ERROR') || subject.includes('#REF')) continue;
      
      if (subject || teacher) {
        const variants = buildLessonVariants(subject, teacher, classroom);
        
        for (const variant of variants) {
          lessons.push({
            id: `lesson-${lessonIndex++}`,
            dayOfWeek: currentDay,
            startTime: effectiveTimeRange.startTime,
            endTime: effectiveTimeRange.endTime,
            subject: variant.subject,
            teacher: variant.teacher,
            group: group.groupName,
            classroom: variant.classroom,
            weekNumber: variant.weekNumber,
            format: metadata.defaultFormat,
          });
        }
      }
    }
  }
  
  console.log('[CSV-PARSER] Extracted time slots from Monday:', timeSlots);
  
  return { lessons, errors, metadata };
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
