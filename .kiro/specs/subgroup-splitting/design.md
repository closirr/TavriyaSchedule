# Design Document: Subgroup Splitting

## Overview

Цей документ описує технічний дизайн функціоналу поділу занять на підгрупи. Функціонал дозволяє відображати ситуації, коли академічна група ділиться на дві частини, і кожна частина відвідує різні заняття в один час.

Ключові відмінності від поділу на тижні:
- **Тижні** (`/`): чергуються щотижня, відображаються як flip-картки на сайті та вертикальна лінія при друку
- **Підгрупи** (`;`): постійний поділ, відображаються з горизонтальною лінією і на сайті, і при друку

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CSV/Excel Data                          │
│  "Математика; Українська мова" (підгрупи)                       │
│  "Фізика / Хімія" (тижні)                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      csv-parser.ts                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ splitSubgroupValues(value: string)                       │   │
│  │ - Розпізнає ";" як роздільник підгруп                   │   │
│  │ - Повертає [subgroup1, subgroup2] або null              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ buildLessonVariants() - оновлено                        │   │
│  │ - Спочатку перевіряє підгрупи (;)                       │   │
│  │ - Потім перевіряє тижні (/)                             │   │
│  │ - Створює Lesson з subgroupNumber: 1 | 2                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Lesson Type                                │
│  {                                                              │
│    id, dayOfWeek, startTime, endTime,                          │
│    subject, teacher, group, classroom,                          │
│    weekNumber?: 1 | 2,      // для тижнів                      │
│    subgroupNumber?: 1 | 2,  // для підгруп (НОВЕ)              │
│    format?: 'онлайн' | 'офлайн'                                │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   schedule-grid.tsx     │     │  schedule-printer.ts    │
│                         │     │                         │
│ LessonSlot:             │     │ PrinterCellData:        │
│ - week1Lesson           │     │ - single                │
│ - week2Lesson           │     │ - week1, week2          │
│ - subgroup1Lesson (NEW) │     │ - subgroup1 (NEW)       │
│ - subgroup2Lesson (NEW) │     │ - subgroup2 (NEW)       │
│ - regularLesson         │     │                         │
│                         │     │ Горизонтальна лінія     │
│ Горизонтальна лінія     │     │ для підгруп             │
│ для підгруп             │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

## Components and Interfaces

### 1. Оновлений тип Lesson (schedule.ts)

```typescript
export interface Lesson {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  group: string;
  classroom: string;
  weekNumber?: WeekNumber;      // 1 | 2 для тижнів
  subgroupNumber?: SubgroupNumber; // 1 | 2 для підгруп (НОВЕ)
  format?: LessonFormat;
}

export type SubgroupNumber = 1 | 2;
```

### 2. Функція парсингу підгруп (csv-parser.ts)

```typescript
/**
 * Розділяє значення комірки на підгрупи за символом ";"
 * Пріоритет: ";" (підгрупи) > "/" (тижні)
 * 
 * @param value - Значення комірки
 * @returns [subgroup1, subgroup2] або null якщо немає поділу
 */
function splitSubgroupValues(value: string): [string, string] | null {
  if (!value || !value.includes(';')) return null;
  
  const parts = value.split(';').map(p => p.trim());
  if (parts.length < 2) return null;
  
  return [parts[0], parts[1]];
}
```

### 3. Оновлена функція buildLessonVariants (csv-parser.ts)

```typescript
function buildLessonVariants(
  subject: string,
  teacher: string,
  classroom: string
): Array<{
  subject: string;
  teacher: string;
  classroom: string;
  weekNumber?: WeekNumber;
  subgroupNumber?: SubgroupNumber;
}> {
  // 1. Спочатку перевіряємо підгрупи (;)
  const subjectSubgroups = splitSubgroupValues(subject);
  const teacherSubgroups = splitSubgroupValues(teacher);
  const classroomSubgroups = splitSubgroupValues(classroom);
  
  if (subjectSubgroups || teacherSubgroups || classroomSubgroups) {
    // Обробка підгруп
    const [subject1, subject2] = subjectSubgroups ?? [subject, subject];
    const [teacher1, teacher2] = teacherSubgroups ?? [teacher, teacher];
    const [classroom1, classroom2] = classroomSubgroups ?? [classroom, classroom];
    
    const result = [];
    
    if (!isEmptyLesson(subject1) || !isEmptyLesson(teacher1)) {
      result.push({
        subject: subject1 || '-',
        teacher: teacher1 || '-',
        classroom: classroom1 || '-',
        subgroupNumber: 1 as SubgroupNumber,
      });
    }
    
    if (!isEmptyLesson(subject2) || !isEmptyLesson(teacher2)) {
      result.push({
        subject: subject2 || '-',
        teacher: teacher2 || '-',
        classroom: classroom2 || '-',
        subgroupNumber: 2 as SubgroupNumber,
      });
    }
    
    return result;
  }
  
  // 2. Потім перевіряємо тижні (/) - існуюча логіка
  // ... existing week splitting code ...
}
```

### 4. Оновлений LessonSlot (schedule-grid.tsx)

```typescript
interface LessonSlot {
  key: string;
  // Тижні (flip-картки)
  week1Lesson?: Lesson;
  week2Lesson?: Lesson;
  // Підгрупи (горизонтальна лінія) - НОВЕ
  subgroup1Lesson?: Lesson;
  subgroup2Lesson?: Lesson;
  // Звичайне заняття
  regularLesson?: Lesson;
  // Тип слоту
  isAlternating: boolean;      // true якщо є тижні
  isSubgroupSplit: boolean;    // true якщо є підгрупи (НОВЕ)
}
```

### 5. Компонент SubgroupCard (schedule-grid.tsx)

```typescript
function SubgroupCard({ 
  slot, 
  index, 
  isCurrent 
}: { 
  slot: LessonSlot; 
  index: number; 
  isCurrent: boolean;
}) {
  const subgroup1 = slot.subgroup1Lesson;
  const subgroup2 = slot.subgroup2Lesson;
  
  return (
    <Card className="...">
      {/* Верхня частина - підгрупа 1 */}
      <div className="subgroup-part subgroup-1">
        {subgroup1 ? (
          <LessonContent lesson={subgroup1} label="1 підгрупа" />
        ) : (
          <EmptySubgroup label="1 підгрупа" />
        )}
      </div>
      
      {/* Горизонтальна лінія-розділювач */}
      <div className="border-t border-gray-300 my-1" />
      
      {/* Нижня частина - підгрупа 2 */}
      <div className="subgroup-part subgroup-2">
        {subgroup2 ? (
          <LessonContent lesson={subgroup2} label="2 підгрупа" />
        ) : (
          <EmptySubgroup label="2 підгрупа" />
        )}
      </div>
    </Card>
  );
}
```

### 6. Оновлений PrinterCellData (schedule-printer.ts)

```typescript
interface PrinterCellData {
  /** Звичайний урок */
  single?: PrinterLessonData;
  /** Тижні (вертикальна лінія) */
  week1?: PrinterLessonData;
  week2?: PrinterLessonData;
  /** Підгрупи (горизонтальна лінія) - НОВЕ */
  subgroup1?: PrinterLessonData;
  subgroup2?: PrinterLessonData;
}
```

### 7. CSS стилі для друку підгруп

```css
/* Стилі для підгруп - горизонтальний поділ */
.subgroup-cell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 40px;
}

.subgroup-cell .subgroup-part {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2px;
}

.subgroup-cell .subgroup-part.subgroup-1 {
  border-bottom: 1px solid #000;
}

/* Існуючі стилі для тижнів - вертикальний поділ */
.split-cell {
  display: flex;
  flex-direction: row; /* горизонтальний flex */
}

.split-cell .week-part.week1 {
  border-right: 1px solid #000;
}
```

## Data Models

### Lesson з підгрупою

```typescript
// Приклад заняття для підгрупи 1
{
  id: "lesson-1",
  dayOfWeek: "Понеділок",
  startTime: "09:00",
  endTime: "10:30",
  subject: "Математика",
  teacher: "Іванов І.І.",
  group: "КН-21",
  classroom: "101",
  subgroupNumber: 1
}

// Приклад заняття для підгрупи 2 (той самий час)
{
  id: "lesson-2",
  dayOfWeek: "Понеділок",
  startTime: "09:00",
  endTime: "10:30",
  subject: "Українська мова",
  teacher: "Петрова О.В.",
  group: "КН-21",
  classroom: "102",
  subgroupNumber: 2
}
```

### Формат даних в Excel

| Час | КН-21 (предмет) | КН-21 (викладач) | КН-21 (аудиторія) |
|-----|-----------------|------------------|-------------------|
| 9:00-10:30 | Математика; Українська мова | Іванов І.І.; Петрова О.В. | 101; 102 |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Semicolon Splitting

*For any* cell value containing a semicolon (`;`), the parser SHALL split it into exactly two parts at the first semicolon occurrence.

**Validates: Requirements 1.1**

### Property 2: Empty Subgroup Handling

*For any* subgroup part that is empty, contains only whitespace, or contains only a dash character (`-`, `—`, `–`), the parser SHALL treat that subgroup as having no lesson and not create a Lesson object for it.

**Validates: Requirements 1.2, 1.3**

### Property 3: Separator Priority

*For any* cell value containing both semicolon (`;`) and slash (`/`), the parser SHALL treat semicolon as the primary separator for subgroups, ignoring slash for week splitting in that cell.

**Validates: Requirements 1.4**

### Property 4: Subgroup Number Assignment

*For any* successfully parsed subgroup cell, the parser SHALL create Lesson objects where the first part has `subgroupNumber: 1` and the second part has `subgroupNumber: 2`.

**Validates: Requirements 1.5**

### Property 5: Subgroup Slot Grouping

*For any* two lessons with the same `dayOfWeek`, `startTime`, `endTime`, and `group` but different `subgroupNumber` values, the Schedule_Grid SHALL group them into a single LessonSlot with `isSubgroupSplit: true`.

**Validates: Requirements 2.3**

### Property 6: Print Subgroup Structure

*For any* PrinterCellData with both `subgroup1` and `subgroup2` defined, the generated HTML SHALL contain a container with `flex-direction: column` and a horizontal border between the two parts, with subgroup1 appearing before subgroup2 in the DOM.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: Print Single Subgroup Handling

*For any* PrinterCellData with only one of `subgroup1` or `subgroup2` defined, the generated HTML SHALL display the defined subgroup and show a dash or empty space for the undefined subgroup.

**Validates: Requirements 4.4**

### Property 8: Week Splitting Preservation

*For any* PrinterCellData with `week1` and/or `week2` defined (without subgroups), the generated HTML SHALL maintain the existing vertical line separation with `flex-direction: row`.

**Validates: Requirements 4.5**

### Property 9: Combined Week and Subgroup Parsing

*For any* cell value that can be interpreted as having both week and subgroup dimensions, the parser SHALL correctly identify and parse the subgroup dimension (semicolon) as the primary split.

**Validates: Requirements 5.1**

### Property 10: Subgroup Filtering

*For any* set of lessons and a subgroup filter value (1 or 2), the filtered result SHALL contain only lessons where `subgroupNumber` equals the filter value OR `subgroupNumber` is undefined. When no filter is applied, all lessons SHALL be included.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Парсинг

1. **Некоректний формат підгруп**: Якщо комірка містить `;` але не може бути коректно розпарсена, система логує попередження і трактує комірку як звичайне заняття.

2. **Пусті підгрупи**: Якщо обидві частини після розділення порожні, система не створює жодного заняття для цього слоту.

3. **Конфлікт роздільників**: Якщо комірка містить і `;` і `/`, пріоритет має `;` (підгрупи).

### Відображення

1. **Відсутня підгрупа**: Якщо є заняття тільки для однієї підгрупи, інша частина показує прочерк або пусте місце.

2. **Невалідний subgroupNumber**: Якщо `subgroupNumber` не є 1 або 2, заняття трактується як звичайне.

## Testing Strategy

### Unit Tests

1. **Парсинг підгруп**:
   - Тест розділення по `;`
   - Тест обробки пустих частин
   - Тест пріоритету `;` над `/`
   - Тест присвоєння subgroupNumber

2. **Групування слотів**:
   - Тест об'єднання занять з різними subgroupNumber
   - Тест розрізнення підгруп від тижнів

3. **Генерація HTML для друку**:
   - Тест горизонтальної лінії для підгруп
   - Тест вертикальної лінії для тижнів
   - Тест обробки одиночних підгруп

### Property-Based Tests

Використовуємо **fast-check** для TypeScript:

```typescript
import fc from 'fast-check';

// Property 1: Semicolon Splitting
fc.assert(
  fc.property(
    fc.string().filter(s => s.includes(';')),
    (value) => {
      const result = splitSubgroupValues(value);
      return result !== null && result.length === 2;
    }
  )
);

// Property 2: Empty Subgroup Handling
fc.assert(
  fc.property(
    fc.constantFrom('', ' ', '  ', '-', '—', '–'),
    (emptyValue) => {
      const result = buildLessonVariants(`${emptyValue};Valid`, 'Teacher', 'Room');
      return result.every(l => l.subgroupNumber !== 1 || l.subject !== emptyValue);
    }
  )
);
```

Мінімум 100 ітерацій для кожного property-based тесту.

Кожен тест має бути анотований:
```typescript
// Feature: subgroup-splitting, Property 1: Semicolon Splitting
// Validates: Requirements 1.1
```
