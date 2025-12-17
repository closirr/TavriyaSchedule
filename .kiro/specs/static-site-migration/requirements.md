# Requirements Document

## Introduction

Цей документ описує вимоги до переписування системи управління розкладом Таврійського Коледжу з динамічного сервісу на статичний сайт. Основна зміна — перехід від завантаження Excel файлів та серверного зберігання до отримання даних виключно з Google Таблиці. Функціонал шаблонів буде видалено.

## Glossary

- **Static_Site**: Веб-сайт, який не потребує серверної логіки для відображення даних, всі дані завантажуються на клієнті
- **Google_Sheets_API**: Публічний API Google для читання даних з Google Таблиць без автентифікації (для публічних таблиць)
- **Schedule_Data**: Дані розкладу занять, що включають день тижня, час, предмет, викладача, групу та аудиторію
- **Filter_Options**: Набір унікальних значень груп, викладачів та аудиторій для фільтрації розкладу
- **CSV_Export**: Формат експорту даних з Google Таблиці через публічний URL

## Requirements

### Requirement 1

**User Story:** Як користувач, я хочу переглядати розклад занять, завантажений автоматично з Google Таблиці, щоб завжди бачити актуальну інформацію без ручного завантаження файлів.

#### Acceptance Criteria

1. WHEN the Static_Site loads THEN the system SHALL fetch Schedule_Data from the configured Google_Sheets_API endpoint
2. WHEN Schedule_Data is successfully fetched THEN the system SHALL parse the CSV response and transform it into the internal lesson format
3. WHEN parsing Schedule_Data THEN the system SHALL validate each row against the expected schema (dayOfWeek, startTime, endTime, subject, teacher, group, classroom)
4. IF the Google_Sheets_API request fails THEN the system SHALL display an error message to the user and retry after 5 seconds
5. WHEN Schedule_Data contains invalid rows THEN the system SHALL skip invalid rows and continue processing valid data

### Requirement 2

**User Story:** Як користувач, я хочу фільтрувати розклад за групою, викладачем, аудиторією або пошуковим запитом, щоб швидко знаходити потрібну інформацію.

#### Acceptance Criteria

1. WHEN Schedule_Data is loaded THEN the system SHALL extract unique Filter_Options (groups, teachers, classrooms) from the data
2. WHEN a user selects a group filter THEN the system SHALL display only lessons matching the selected group
3. WHEN a user selects a teacher filter THEN the system SHALL display only lessons matching the selected teacher
4. WHEN a user selects a classroom filter THEN the system SHALL display only lessons matching the selected classroom
5. WHEN a user enters a search query THEN the system SHALL display lessons where subject, teacher, group, or classroom contains the search text

### Requirement 3

**User Story:** Як користувач, я хочу бачити статистику розкладу (кількість занять, груп, викладачів, аудиторій), щоб мати загальне уявлення про навантаження.

#### Acceptance Criteria

1. WHEN Schedule_Data is loaded THEN the system SHALL calculate and display the total number of lessons
2. WHEN Schedule_Data is loaded THEN the system SHALL calculate and display the count of unique groups
3. WHEN Schedule_Data is loaded THEN the system SHALL calculate and display the count of unique teachers
4. WHEN Schedule_Data is loaded THEN the system SHALL calculate and display the count of unique classrooms

### Requirement 4

**User Story:** Як розробник, я хочу видалити серверну частину та функціонал шаблонів, щоб спростити архітектуру та зменшити витрати на хостинг.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the system SHALL operate without Express.js server
2. WHEN the migration is complete THEN the system SHALL not include file upload functionality
3. WHEN the migration is complete THEN the system SHALL not include template gallery or template download features
4. WHEN the migration is complete THEN the system SHALL not include PDF/DOCX generation on server side

### Requirement 5

**User Story:** Як користувач, я хочу мати можливість налаштувати URL Google Таблиці через конфігурацію, щоб адміністратор міг змінювати джерело даних без перезбірки сайту.

#### Acceptance Criteria

1. WHEN the Static_Site is deployed THEN the system SHALL read the Google Sheets URL from environment configuration
2. WHEN the Google Sheets URL is not configured THEN the system SHALL display a configuration error message
3. WHEN the Google Sheets URL format is invalid THEN the system SHALL display a validation error message

### Requirement 6

**User Story:** Як користувач, я хочу бачити індикатор завантаження та час останнього оновлення даних, щоб розуміти актуальність інформації.

#### Acceptance Criteria

1. WHILE Schedule_Data is being fetched THEN the system SHALL display a loading indicator
2. WHEN Schedule_Data is successfully loaded THEN the system SHALL display the timestamp of the last successful fetch
3. WHEN a user clicks the refresh button THEN the system SHALL re-fetch Schedule_Data from Google_Sheets_API

### Requirement 7

**User Story:** Як користувач, я хочу мати можливість оновити дані вручну, щоб отримати найсвіжішу версію розкладу.

#### Acceptance Criteria

1. WHEN the user interface loads THEN the system SHALL display a refresh button
2. WHEN a user clicks the refresh button THEN the system SHALL fetch fresh Schedule_Data from Google_Sheets_API
3. WHILE refresh is in progress THEN the system SHALL disable the refresh button and show loading state

### Requirement 8

**User Story:** Як розробник, я хочу мати чітке розділення між логікою даних та UI компонентами, щоб можна було легко замінити весь дизайн сайту без переписування бізнес-логіки.

#### Acceptance Criteria

1. WHEN the architecture is implemented THEN the system SHALL separate data fetching logic into dedicated hooks independent of UI components
2. WHEN the architecture is implemented THEN the system SHALL separate data transformation and filtering logic into pure utility functions
3. WHEN the architecture is implemented THEN the system SHALL define TypeScript interfaces for all data structures shared between logic and UI layers
4. WHEN the architecture is implemented THEN the system SHALL keep UI components as thin presentation layers that receive data through props or hooks
5. WHEN a developer replaces UI components THEN the data hooks and utility functions SHALL remain unchanged and reusable

