# Design Document: Excel Schedule Parsing Tests

## Overview

Цей документ описує дизайн тестів для модуля парсингу розкладу з Excel/CSV файлів. Тести використовують property-based testing з бібліотекою fast-check для валідації коректності парсингу.

## Architecture

```mermaid
graph TD
    A[CSV Input] --> B[parseCSVLine]
    B --> C[Field Array]
    
    A --> D[parseScheduleCSV]
    D --> E[extractMetadata]
    D --> F[parseGroupHeaders]
    D --> G[isDayOfWeek]
    D --> H[parseTimeRange]
    
    E --> I[ScheduleMetadata]
    F --> J[GroupColumn[]]
    G --> K[DayOfWeek | null]
    H --> L[TimeRange | null]
    
    D --> M[Lesson[]]
    M --> N[lessonsToCSV]
    N --> O[CSV Output]
```

## Components and Interfaces

### Internal Functions (to be tested)

```typescript
// Парсинг CSV рядка
function parseCSVLine(line: string): string[]

// Визначення дня тижня
function isDayOfWeek(cell: string): DayOfWeek | null

// Парсинг часового діапазону
function parseTimeRange(timeStr: string): { startTime: string; endTime: string } | null

// Витягування метаданих
function extractMetadata(lines: string[]): ScheduleMetadata

// Витягування номера тижня
function extractWeekNumber(text: string): WeekNumber | null

// Витягування формату занять
function extractLessonFormat(text: string): LessonFormat | null

// Парсинг заголовків груп
function parseGroupHeaders(headerRow: string[]): GroupColumn[]
```

### Public Functions

```typescript
// Основний парсер
export function parseScheduleCSV(csv: string): ParseResult

// Серіалізація
export function lessonsToCSV(lessons: Lesson[], includeHeader?: boolean): string
```

## Data Models

### GroupColumn
```typescript
interface GroupColumn {
  groupName: string;
  subjectCol: number;
  teacherCol: number;
  classroomCol: number;
}
```

### Test Generators

```typescript
// Генератор валідного часу HH:MM
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

// Генератор дня тижня
const dayOfWeekArb = fc.constantFrom(...DAYS_OF_WEEK);

// Генератор безпечного рядка (без спецсимволів CSV)
const safeStringArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => !s.includes(',') && !s.includes('"') && !s.includes('\n'))
  .filter(s => s.trim().length > 0);

// Генератор валідного уроку
const lessonArb = fc.record({
  dayOfWeek: dayOfWeekArb,
  startTime: timeArb,
  endTime: timeArb,
  subject: safeStringArb,
  teacher: safeStringArb,
  group: safeStringArb,
  classroom: safeStringArb,
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSV Line Parsing Preserves Field Content

*For any* CSV рядок з N полями (розділених комами), парсинг SHALL повернути масив з N елементів, де кожен елемент відповідає оригінальному полю (з обрізаними пробілами).

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: CSV Quoted Fields Are Handled Correctly

*For any* рядок, що містить коми або лапки, екранування в лапки та парсинг SHALL зберегти оригінальний вміст.

**Validates: Requirements 1.1, 1.2**

### Property 3: Day of Week Detection Is Correct

*For any* валідний день тижня (з DAYS_OF_WEEK), функція isDayOfWeek SHALL повернути відповідний день незалежно від регістру та пробілів.

**Validates: Requirements 2.1, 2.4**

### Property 4: Invalid Day Returns Null

*For any* рядок, що не є валідним днем тижня, функція isDayOfWeek SHALL повернути null.

**Validates: Requirements 2.3**

### Property 5: Time Range Parsing Normalizes Format

*For any* валідний часовий діапазон (години 0-23, хвилини 0-59), парсинг SHALL повернути нормалізований формат HH:MM.

**Validates: Requirements 3.1, 3.2**

### Property 6: Invalid Time Returns Null

*For any* рядок, що не відповідає формату часового діапазону, функція parseTimeRange SHALL повернути null.

**Validates: Requirements 3.4**

### Property 7: Week Number Extraction Is Correct

*For any* текст, що містить "1 тиждень" або "2 тиждень" (у різних варіантах написання), функція extractWeekNumber SHALL повернути відповідний номер тижня.

**Validates: Requirements 4.1, 4.2**

### Property 8: Lesson Format Extraction Is Correct

*For any* текст, що містить ключові слова формату (онлайн/офлайн), функція extractLessonFormat SHALL повернути відповідний формат.

**Validates: Requirements 4.3, 4.4**

### Property 9: Group Header Parsing Creates Correct Structures

*For any* заголовковий рядок з N групами, функція parseGroupHeaders SHALL створити N об'єктів GroupColumn з правильними індексами колонок.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 10: Serialization Round Trip

*For any* валідний масив уроків, серіалізація в CSV та парсинг назад SHALL повернути еквівалентні дані (ті самі поля, можливо інші ID).

**Validates: Requirements 7.3**

### Property 11: CSV Field Escaping Is Correct

*For any* поле, що містить коми, лапки або переноси рядків, функція escapeCSVField SHALL коректно екранувати його, і парсинг SHALL відновити оригінальне значення.

**Validates: Requirements 7.2**

### Property 12: Empty Lessons Are Filtered

*For any* CSV з рядками, де предмет та викладач порожні, парсер SHALL пропустити ці рядки і не створювати уроки.

**Validates: Requirements 6.5**

## Error Handling

### Input Validation
- null/undefined input → повертає `{ lessons: [], errors: [{ row: 0, message: 'Invalid CSV input' }] }`
- Менше 3 рядків → повертає `{ lessons: [], errors: [{ row: 0, message: 'Not enough data rows' }] }`

### Data Validation
- #ERROR/#REF в комірці → пропускає урок
- Порожній предмет і викладач → пропускає урок
- Невалідний час → пропускає рядок

## Testing Strategy

### Property-Based Testing

Використовуємо **fast-check** для property-based тестів:
- Мінімум 100 ітерацій на кожен property test
- Кожен тест анотований посиланням на property з дизайну

### Unit Tests

Unit тести для edge cases:
- null/undefined input
- Порожній рядок
- CSV тільки з заголовком
- П'ятниця з апострофом ("П'ЯТНИЦЯ" vs "ПЯТНИЦЯ")
- Довге тире в часі ("–" vs "-")
- #ERROR та #REF в комірках

### Test File Structure

```
client/src/lib/__tests__/
├── csv-parser.test.ts          # Існуючі тести (потребують оновлення)
├── csv-parser-internal.test.ts # Нові тести для внутрішніх функцій
└── schedule-utils.test.ts      # Існуючі тести
```

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

### Property Test Format

```typescript
/**
 * **Feature: excel-schedule-parsing-tests, Property N: Property Title**
 * **Validates: Requirements X.Y**
 */
it('property description', () => {
  fc.assert(
    fc.property(generator, (input) => {
      // Test logic
      return true;
    }),
    { numRuns: 100 }
  );
});
```
