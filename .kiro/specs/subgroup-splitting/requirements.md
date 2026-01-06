# Requirements Document

## Introduction

Цей документ описує вимоги до функціоналу поділу занять на підгрупи. Підгрупи — це механізм, коли одна академічна група ділиться на дві частини, і кожна частина відвідує різні заняття в один і той самий час. На відміну від поділу на тижні (який чергується щотижня), поділ на підгрупи є постійним — перша підгрупа завжди йде на один предмет, друга — на інший.

## Glossary

- **Subgroup_Parser**: Компонент, що розпізнає та парсить дані про підгрупи з CSV/Excel
- **Schedule_Grid**: Компонент відображення розкладу на веб-сайті
- **Schedule_Printer**: Компонент генерації HTML для друку розкладу
- **Subgroup**: Частина академічної групи (1 або 2), яка відвідує окреме заняття
- **Subgroup_Separator**: Символ крапки з комою (`;`), що розділяє дані підгруп в Excel
- **Week_Separator**: Символ слешу (`/`), що розділяє дані тижнів в Excel (існуючий функціонал)
- **Lesson_Cell**: Комірка в розкладі, що може містити звичайне заняття, мигалку (тижні) або підгрупи

## Requirements

### Requirement 1: Парсинг підгруп з CSV

**User Story:** Як адміністратор розкладу, я хочу вводити дані про підгрупи через крапку з комою в Excel, щоб система автоматично розпізнавала поділ на підгрупи.

#### Acceptance Criteria

1. WHEN a cell contains a semicolon (`;`) separator, THE Subgroup_Parser SHALL split the content into two subgroup parts
2. WHEN the first part before semicolon is empty or contains only dash/whitespace, THE Subgroup_Parser SHALL treat subgroup 1 as having no lesson
3. WHEN the second part after semicolon is empty or contains only dash/whitespace, THE Subgroup_Parser SHALL treat subgroup 2 as having no lesson
4. WHEN a cell contains both slash (`/`) and semicolon (`;`), THE Subgroup_Parser SHALL prioritize semicolon as subgroup separator
5. THE Subgroup_Parser SHALL create separate Lesson objects with subgroupNumber property (1 or 2) for each subgroup part

### Requirement 2: Структура даних для підгруп

**User Story:** Як розробник, я хочу мати чітку структуру даних для підгруп, щоб компоненти відображення та друку могли коректно обробляти цю інформацію.

#### Acceptance Criteria

1. THE Lesson type SHALL include an optional subgroupNumber field of type 1 | 2
2. WHEN a lesson has subgroupNumber defined, THE Schedule_Grid SHALL display it with subgroup indicator
3. WHEN two lessons exist for the same time slot with different subgroupNumbers, THE Schedule_Grid SHALL display them as a split cell

### Requirement 3: Відображення підгруп на веб-сайті

**User Story:** Як студент, я хочу бачити заняття для обох підгруп в одній комірці з горизонтальним розділенням, щоб легко зрозуміти куди йде моя підгрупа.

#### Acceptance Criteria

1. WHEN a time slot has lessons for both subgroups, THE Schedule_Grid SHALL display them separated by a horizontal line
2. THE Schedule_Grid SHALL display subgroup 1 lesson above the horizontal line
3. THE Schedule_Grid SHALL display subgroup 2 lesson below the horizontal line
4. WHEN only one subgroup has a lesson, THE Schedule_Grid SHALL display empty space or dash for the other subgroup
5. THE Schedule_Grid SHALL visually distinguish subgroup splitting from week splitting (horizontal vs flip cards)

### Requirement 4: Друк підгруп

**User Story:** Як адміністратор, я хочу друкувати розклад з коректним відображенням підгруп через горизонтальну лінію, щоб роздруківка була зрозумілою для студентів.

#### Acceptance Criteria

1. WHEN printing a cell with subgroup lessons, THE Schedule_Printer SHALL display them separated by a horizontal line
2. THE Schedule_Printer SHALL display subgroup 1 lesson in the top part of the cell
3. THE Schedule_Printer SHALL display subgroup 2 lesson in the bottom part of the cell
4. WHEN only one subgroup has a lesson, THE Schedule_Printer SHALL display dash or empty space for the other subgroup
5. THE Schedule_Printer SHALL maintain vertical line separation for week splitting (existing behavior)

### Requirement 5: Комбінований поділ

**User Story:** Як адміністратор розкладу, я хочу мати можливість комбінувати поділ на тижні та підгрупи, щоб відображати складні варіанти розкладу.

#### Acceptance Criteria

1. WHEN a cell contains both week and subgroup data, THE Subgroup_Parser SHALL correctly parse both dimensions
2. IF parsing of combined format fails, THEN THE Subgroup_Parser SHALL log a warning and treat the cell as regular lesson
3. THE Schedule_Grid SHALL support displaying lessons that have both weekNumber and subgroupNumber

### Requirement 6: Фільтрація по підгрупах

**User Story:** Як студент, я хочу фільтрувати розклад по своїй підгрупі, щоб бачити тільки релевантні для мене заняття.

#### Acceptance Criteria

1. WHERE subgroup filter is enabled, THE Schedule_Grid SHALL show only lessons for the selected subgroup
2. WHEN no subgroup filter is applied, THE Schedule_Grid SHALL show lessons for both subgroups in split view
3. THE Schedule_Filters component SHALL include subgroup selector (1, 2, or both)
