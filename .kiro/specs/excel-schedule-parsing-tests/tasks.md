# Implementation Plan: Excel Schedule Parsing Tests

## Overview

План імплементації тестів для модуля парсингу розкладу з Excel/CSV. Тести використовують Vitest та fast-check для property-based testing. Внутрішні функції потрібно експортувати для тестування.

## Tasks

- [ ] 1. Підготовка модуля для тестування
  - [ ] 1.1 Експортувати внутрішні функції з csv-parser.ts для тестування
    - Експортувати: parseCSVLine, isDayOfWeek, parseTimeRange, extractMetadata, extractWeekNumber, extractLessonFormat, parseGroupHeaders
    - Використати named exports для внутрішніх функцій
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 2. Тести парсингу CSV рядків
  - [ ] 2.1 Створити генератори для CSV полів
    - Генератор безпечних рядків (без спецсимволів)
    - Генератор рядків з комами
    - Генератор рядків з лапками
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.2 Property test: CSV Line Parsing Preserves Field Content
    - **Property 1: CSV Line Parsing Preserves Field Content**
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [ ] 2.3 Property test: CSV Quoted Fields Are Handled Correctly
    - **Property 2: CSV Quoted Fields Are Handled Correctly**
    - **Validates: Requirements 1.1, 1.2**

- [ ] 3. Тести визначення дня тижня
  - [ ] 3.1 Створити генератори для днів тижня
    - Генератор валідних днів (з DAYS_OF_WEEK)
    - Генератор невалідних рядків
    - _Requirements: 2.1, 2.3_

  - [ ] 3.2 Property test: Day of Week Detection Is Correct
    - **Property 3: Day of Week Detection Is Correct**
    - **Validates: Requirements 2.1, 2.4**

  - [ ] 3.3 Property test: Invalid Day Returns Null
    - **Property 4: Invalid Day Returns Null**
    - **Validates: Requirements 2.3**

  - [ ] 3.4 Unit test: П'ятниця з апострофом
    - Тест для "ПЯТНИЦЯ" та "П'ЯТНИЦЯ"
    - _Requirements: 2.2_

- [ ] 4. Тести парсингу часових діапазонів
  - [ ] 4.1 Створити генератори для часу
    - Генератор валідних годин (0-23)
    - Генератор валідних хвилин (0-59)
    - Генератор невалідних часових рядків
    - _Requirements: 3.1, 3.4_

  - [ ] 4.2 Property test: Time Range Parsing Normalizes Format
    - **Property 5: Time Range Parsing Normalizes Format**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 4.3 Property test: Invalid Time Returns Null
    - **Property 6: Invalid Time Returns Null**
    - **Validates: Requirements 3.4**

  - [ ] 4.4 Unit test: Довге тире в часі
    - Тест для "9:00–10:30" (з довгим тире)
    - _Requirements: 3.3_

- [ ] 5. Checkpoint - Перевірка базових функцій
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Тести витягування метаданих
  - [ ] 6.1 Створити генератори для метаданих
    - Генератор тексту з номером тижня
    - Генератор тексту з форматом занять
    - _Requirements: 4.1, 4.3_

  - [ ] 6.2 Property test: Week Number Extraction Is Correct
    - **Property 7: Week Number Extraction Is Correct**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 6.3 Property test: Lesson Format Extraction Is Correct
    - **Property 8: Lesson Format Extraction Is Correct**
    - **Validates: Requirements 4.3, 4.4**

  - [ ] 6.4 Unit test: Витягування семестру
    - Тест для "2 семестр 2024-2025 н.р."
    - _Requirements: 4.5_

- [ ] 7. Тести парсингу заголовків груп
  - [ ] 7.1 Створити генератори для заголовків
    - Генератор назв груп
    - Генератор заголовкових рядків
    - _Requirements: 5.2_

  - [ ] 7.2 Property test: Group Header Parsing Creates Correct Structures
    - **Property 9: Group Header Parsing Creates Correct Structures**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ] 7.3 Unit test: Детекція заголовка
    - Тест для рядка з "час" в першій колонці
    - _Requirements: 5.1_

- [ ] 8. Тести серіалізації та round-trip
  - [ ] 8.1 Створити генератори для уроків
    - Генератор валідних Lesson об'єктів
    - Генератор масивів уроків
    - _Requirements: 7.3_

  - [ ] 8.2 Property test: Serialization Round Trip
    - **Property 10: Serialization Round Trip**
    - **Validates: Requirements 7.3**

  - [ ] 8.3 Property test: CSV Field Escaping Is Correct
    - **Property 11: CSV Field Escaping Is Correct**
    - **Validates: Requirements 7.2**

- [ ] 9. Checkpoint - Перевірка серіалізації
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Тести фільтрації та обробки помилок
  - [ ] 10.1 Property test: Empty Lessons Are Filtered
    - **Property 12: Empty Lessons Are Filtered**
    - **Validates: Requirements 6.5**

  - [ ] 10.2 Unit test: #ERROR та #REF фільтрація
    - Тест для комірок з #ERROR та #REF
    - _Requirements: 6.4_

  - [ ] 10.3 Unit test: null/undefined input
    - Тест для null та undefined вхідних даних
    - _Requirements: 8.1_

  - [ ] 10.4 Unit test: Недостатньо рядків
    - Тест для CSV з менше ніж 3 рядками
    - _Requirements: 8.2_

- [ ] 11. Інтеграційні тести вертикального формату
  - [ ] 11.1 Unit test: Парсинг реального розкладу
    - Тест з прикладом реального CSV з Google Sheets
    - _Requirements: 6.1, 6.2_

  - [ ] 11.2 Unit test: Повторне використання часових слотів
    - Тест для логіки використання часу з понеділка
    - _Requirements: 6.3_

- [ ] 12. Final checkpoint - Всі тести проходять
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Всі тести обов'язкові для повного покриття
- Внутрішні функції потрібно експортувати для тестування
- Використовуємо Vitest + fast-check для property-based testing
- Мінімум 100 ітерацій для кожного property test
