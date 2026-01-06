# Implementation Plan: Subgroup Splitting

## Overview

Імплементація функціоналу поділу занять на підгрупи. Робота розділена на етапи: типи даних → парсинг → відображення на сайті → друк → фільтрація → тестування.

## Tasks

- [x] 1. Оновити типи даних
  - [x] 1.1 Додати SubgroupNumber тип та поле subgroupNumber до Lesson
    - Додати `export type SubgroupNumber = 1 | 2;` в `client/src/types/schedule.ts`
    - Додати `subgroupNumber?: SubgroupNumber;` до інтерфейсу Lesson
    - _Requirements: 2.1_

- [x] 2. Імплементувати парсинг підгруп
  - [x] 2.1 Створити функцію splitSubgroupValues
    - Додати функцію в `client/src/lib/csv-parser.ts`
    - Розділяє значення по `;` на дві частини
    - Повертає `[string, string] | null`
    - _Requirements: 1.1_

  - [x] 2.2 Оновити buildLessonVariants для підтримки підгруп
    - Спочатку перевіряти підгрупи (`;`), потім тижні (`/`)
    - Створювати Lesson з `subgroupNumber: 1` або `subgroupNumber: 2`
    - Обробляти пусті підгрупи (прочерк, пробіли)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.3 Написати property test для парсингу підгруп
    - **Property 1: Semicolon Splitting**
    - **Property 2: Empty Subgroup Handling**
    - **Property 3: Separator Priority**
    - **Property 4: Subgroup Number Assignment**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 3. Checkpoint - Перевірка парсингу
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Оновити відображення на сайті
  - [x] 4.1 Оновити LessonSlot інтерфейс
    - Додати `subgroup1Lesson?: Lesson` та `subgroup2Lesson?: Lesson`
    - Додати `isSubgroupSplit: boolean`
    - Оновити логіку групування в `useMemo`
    - _Requirements: 2.2, 2.3_

  - [x] 4.2 Створити компонент SubgroupCard
    - Відображає дві підгрупи з горизонтальною лінією
    - Підгрупа 1 зверху, підгрупа 2 знизу
    - Обробляє випадок коли одна підгрупа пуста
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.3 Інтегрувати SubgroupCard в ScheduleGrid
    - Додати умовний рендеринг для `isSubgroupSplit`
    - Зберегти існуючу логіку для тижнів (flip-картки)
    - _Requirements: 3.5_

  - [ ]* 4.4 Написати property test для групування слотів
    - **Property 5: Subgroup Slot Grouping**
    - **Validates: Requirements 2.3**

- [x] 5. Checkpoint - Перевірка відображення
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Оновити друк
  - [x] 6.1 Оновити PrinterCellData інтерфейс
    - Додати `subgroup1?: PrinterLessonData` та `subgroup2?: PrinterLessonData`
    - _Requirements: 4.1_

  - [x] 6.2 Оновити convertLessonsToPrinterFormat
    - Обробляти `lesson.subgroupNumber` при заповненні комірок
    - Зберігати в `cell.subgroup1` або `cell.subgroup2`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.3 Оновити generateDayBlocks для підгруп
    - Додати CSS клас `.subgroup-cell` з `flex-direction: column`
    - Горизонтальна лінія між підгрупами (`border-bottom`)
    - Зберегти вертикальну лінію для тижнів
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.4 Написати property test для друку підгруп
    - **Property 6: Print Subgroup Structure**
    - **Property 7: Print Single Subgroup Handling**
    - **Property 8: Week Splitting Preservation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 7. Checkpoint - Перевірка друку
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Додати фільтрацію по підгрупах
  - [x] 8.1 Оновити ScheduleFilters тип
    - Додати `subgroup?: SubgroupNumber` до `ScheduleFilters`
    - _Requirements: 6.1, 6.2_

  - [x] 8.2 Оновити filterLessons функцію
    - Додати логіку фільтрації по `subgroupNumber`
    - Якщо фільтр не встановлено - показувати всі
    - _Requirements: 6.1, 6.2_

  - [x] 8.3 Додати селектор підгрупи в UI
    - Додати dropdown в `schedule-filters.tsx`
    - Опції: "Всі", "1 підгрупа", "2 підгрупа"
    - _Requirements: 6.3_

  - [ ]* 8.4 Написати property test для фільтрації
    - **Property 10: Subgroup Filtering**
    - **Validates: Requirements 6.1, 6.2**

- [x] 9. Final checkpoint - Фінальна перевірка
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Використовуємо fast-check для property-based тестів
