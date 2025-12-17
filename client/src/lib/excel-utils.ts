export interface ExcelScheduleRow {
  'День недели': string;
  'Время начала': string;
  'Время окончания': string;
  'Предмет': string;
  'Преподаватель': string;
  'Группа': string;
  'Аудитория': string;
  'Тип занятия': string;
}

export const validateExcelStructure = (data: any[]): string[] => {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('Excel файл пуст');
    return errors;
  }

  const requiredColumns = [
    'День недели',
    'Время начала', 
    'Время окончания',
    'Предмет',
    'Преподаватель',
    'Группа',
    'Аудитория',
    'Тип занятия'
  ];

  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);

  // Check if all required columns are present
  const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
  if (missingColumns.length > 0) {
    errors.push(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
  }

  return errors;
};

export const validateScheduleRow = (row: any, rowIndex: number): string[] => {
  const errors: string[] = [];
  const rowNumber = rowIndex + 2; // Excel is 1-indexed + header row

  // Check required fields
  const requiredFields = [
    'День недели',
    'Время начала',
    'Время окончания', 
    'Предмет',
    'Преподаватель',
    'Группа',
    'Аудитория',
    'Тип занятия'
  ];

  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push(`Строка ${rowNumber}: поле "${field}" не заполнено`);
    }
  }

  // Validate day of week
  const validDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  if (row['День недели'] && !validDays.includes(row['День недели'])) {
    errors.push(`Строка ${rowNumber}: неверный день недели "${row['День недели']}"`);
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (row['Время начала'] && !timeRegex.test(row['Время начала'])) {
    errors.push(`Строка ${rowNumber}: неверный формат времени начала "${row['Время начала']}"`);
  }
  
  if (row['Время окончания'] && !timeRegex.test(row['Время окончания'])) {
    errors.push(`Строка ${rowNumber}: неверный формат времени окончания "${row['Время окончания']}"`);
  }

  // Validate lesson type
  const validLessonTypes = ['Лекция', 'Практика', 'Семинар', 'Лабораторная'];
  if (row['Тип занятия'] && !validLessonTypes.includes(row['Тип занятия'])) {
    // This is a warning, not an error - allow custom lesson types
  }

  return errors;
};

export const formatTimeString = (timeValue: any): string => {
  if (typeof timeValue === 'number') {
    // Excel sometimes stores time as a decimal (0.375 = 9:00 AM)
    const hours = Math.floor(timeValue * 24);
    const minutes = Math.floor((timeValue * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (typeof timeValue === 'string') {
    // Try to parse and reformat
    const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return timeValue.toString();
};
