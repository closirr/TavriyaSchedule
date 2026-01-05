/**
 * Schedule Utility Functions Module
 * 
 * Pure utility functions for filtering, sorting, and calculating statistics
 * from schedule data. These functions are independent of UI components.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 8.2
 */

import type { Lesson, ScheduleFilters, FilterOptions, ScheduleStatistics, DayOfWeek } from '../types/schedule';
import { DAYS_OF_WEEK } from '../types/schedule';

/**
 * Filters lessons based on the provided filter criteria.
 * All filter conditions are applied simultaneously (AND logic).
 * 
 * @param lessons - Array of lessons to filter
 * @param filters - Filter criteria to apply
 * @returns Filtered array of lessons matching all criteria
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */
export function filterLessons(lessons: Lesson[], filters: ScheduleFilters): Lesson[] {
  if (!lessons || !Array.isArray(lessons)) {
    return [];
  }

  return lessons.filter(lesson => {
    // Week filter (only hide mismatched explicit weeks; lessons without weekNumber are shown for both)
    if (filters.weekNumber && lesson.weekNumber && lesson.weekNumber !== filters.weekNumber) {
      return false;
    }

    // Group filter
    if (filters.group && lesson.group !== filters.group) {
      return false;
    }

    // Teacher filter
    if (filters.teacher && lesson.teacher !== filters.teacher) {
      return false;
    }

    // Classroom filter
    if (filters.classroom && lesson.classroom !== filters.classroom) {
      return false;
    }

    // Search filter (searches across subject, teacher, group, classroom)
    if (filters.search && filters.search.trim().length > 0) {
      const searchLower = filters.search.toLowerCase().trim();
      const matchesSearch = 
        lesson.subject.toLowerCase().includes(searchLower) ||
        lesson.teacher.toLowerCase().includes(searchLower) ||
        lesson.group.toLowerCase().includes(searchLower) ||
        lesson.classroom.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts unique filter options from an array of lessons.
 * Returns sorted arrays of unique groups, teachers, and classrooms.
 * 
 * @param lessons - Array of lessons to extract options from
 * @returns FilterOptions with unique, sorted values
 * 
 * Requirements: 2.1
 */
export function extractFilterOptions(lessons: Lesson[]): FilterOptions {
  if (!lessons || !Array.isArray(lessons)) {
    return { groups: [], teachers: [], classrooms: [] };
  }

  const groupsSet = new Set<string>();
  const teachersSet = new Set<string>();
  const classroomsSet = new Set<string>();

  for (const lesson of lessons) {
    if (lesson.group) groupsSet.add(lesson.group);
    if (lesson.teacher) teachersSet.add(lesson.teacher);
    if (lesson.classroom) classroomsSet.add(lesson.classroom);
  }

  return {
    groups: Array.from(groupsSet).sort((a, b) => a.localeCompare(b, 'uk')),
    teachers: Array.from(teachersSet).sort((a, b) => a.localeCompare(b, 'uk')),
    classrooms: Array.from(classroomsSet).sort((a, b) => a.localeCompare(b, 'uk')),
  };
}

/**
 * Calculates statistics from an array of lessons.
 * 
 * @param lessons - Array of lessons to calculate statistics from
 * @returns ScheduleStatistics with counts
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function calculateStatistics(lessons: Lesson[]): ScheduleStatistics {
  if (!lessons || !Array.isArray(lessons)) {
    return { totalLessons: 0, activeGroups: 0, teachers: 0, classrooms: 0 };
  }

  const groupsSet = new Set<string>();
  const teachersSet = new Set<string>();
  const classroomsSet = new Set<string>();

  for (const lesson of lessons) {
    if (lesson.group) groupsSet.add(lesson.group);
    if (lesson.teacher) teachersSet.add(lesson.teacher);
    if (lesson.classroom) classroomsSet.add(lesson.classroom);
  }

  return {
    totalLessons: lessons.length,
    activeGroups: groupsSet.size,
    teachers: teachersSet.size,
    classrooms: classroomsSet.size,
  };
}


/**
 * Map of day names to their numeric order for sorting
 */
const DAY_ORDER: Record<DayOfWeek, number> = {
  'Понеділок': 0,
  'Вівторок': 1,
  'Середа': 2,
  'Четвер': 3,
  "П'ятниця": 4,
  'Субота': 5,
};

/**
 * Converts a time string (HH:MM) to minutes since midnight for comparison
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Sorts lessons by day of week and then by start time.
 * Lessons earlier in the week come first, and within the same day,
 * lessons with earlier start times come first.
 * 
 * @param lessons - Array of lessons to sort
 * @returns New sorted array (does not mutate original)
 * 
 * Requirements: 2.2 (implicit ordering requirement)
 */
export function sortLessonsByDayAndTime(lessons: Lesson[]): Lesson[] {
  if (!lessons || !Array.isArray(lessons)) {
    return [];
  }

  return [...lessons].sort((a, b) => {
    // First compare by day of week
    const dayDiff = DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek];
    if (dayDiff !== 0) {
      return dayDiff;
    }

    // Then compare by start time
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

/**
 * Generates a unique ID for a lesson based on its properties.
 * The ID is deterministic based on the lesson data and index.
 * 
 * @param lesson - Lesson data without ID
 * @param index - Index of the lesson in the array (for uniqueness)
 * @returns Generated unique ID string
 */
export function generateLessonId(lesson: Omit<Lesson, 'id'>, index: number): string {
  const base = `${lesson.dayOfWeek}-${lesson.startTime}-${lesson.group}-${index}`;
  return base.replace(/\s+/g, '_').toLowerCase();
}
