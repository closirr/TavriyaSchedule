import * as XLSX from 'xlsx';
import { join } from 'path';

export interface TemplateVariant {
  name: string;
  filename: string;
  description: string;
  data: any[][];
}

// Вариант 1: Формат как в текущем расписании (точная копия)
export function createWeeklyTemplate(): TemplateVariant {
  const data = [
    ['РАСПИСАНИЕ ЗАНЯТИЙ ТАВРИЧЕСКОГО КОЛЛЕДЖА', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Дні', '№', 'Час', 'МЕТ-11', 'МТ-11', 'ЕкДп-11', 'А-11'],
    ['ПОНЕДІЛОК', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['ВІВТОРОК', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['', '5', '15.10-16.30', '', '', '', ''],
    ['СЕРЕДА', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['ЧЕТВЕР', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['П\'ЯТНИЦЯ', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['ІНСТРУКЦІЯ ПО ЗАПОВНЕННЮ:'],
    ['1. У кожну клітинку групи вписуйте:'],
    ['   Назва предмету'],
    ['   Прізвище викладача'],
    ['   Аудиторія'],
    [''],
    ['ПРИКЛАД:'],
    ['   Математика'],
    ['   Іванов О.І.'],
    ['   каб. 101'],
    [''],
    ['2. Якщо заняття немає - залиште клітинку пустою'],
    ['3. Групи можна змінювати у заголовку стовпців']
  ];

  return {
    name: 'Як зараз (Український формат)',
    filename: 'template_current_format.xlsx',
    description: 'Точна копія вашого поточного формату розкладу. Найзвичніший для заповнення.',
    data
  };
}

// Вариант 2: Русский формат (аналогичный украинскому)
export function createSimpleListTemplate(): TemplateVariant {
  const data = [
    ['РАСПИСАНИЕ ЗАНЯТИЙ ТАВРИЧЕСКОГО КОЛЛЕДЖА', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Дни', '№', 'Время', 'ИТ-21', 'ИТ-22', 'ЭК-21', 'А-21'],
    ['ПОНЕДЕЛЬНИК', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['ВТОРНИК', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['', '5', '15.10-16.30', '', '', '', ''],
    ['СРЕДА', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['ЧЕТВЕРГ', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['ПЯТНИЦА', '1', '9.00-10.20', '', '', '', ''],
    ['', '2', '10.30-11.50', '', '', '', ''],
    ['', '3', '12.10-13.30', '', '', '', ''],
    ['', '4', '13.40-15.00', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ:'],
    ['1. В каждую ячейку группы вписывайте:'],
    ['   Название предмета'],
    ['   Фамилия преподавателя'],
    ['   Аудитория'],
    [''],
    ['ПРИМЕР:'],
    ['   Математика'],
    ['   Иванов А.И.'],
    ['   каб. 101'],
    [''],
    ['2. Если занятия нет - оставьте ячейку пустой'],
    ['3. Группы можно изменять в заголовке столбцов']
  ];

  return {
    name: 'Русский формат',
    filename: 'template_russian_format.xlsx', 
    description: 'Формат на русском языке, аналогичный текущему украинскому.',
    data
  };
}

// Вариант 3: Простая таблица (каждое занятие отдельно)
export function createGroupBasedTemplate(): TemplateVariant {
  const data = [
    ['РАСПИСАНИЕ ЗАНЯТИЙ - ПРОСТАЯ ТАБЛИЦА'],
    [''],
    ['День недели', 'Время начала', 'Время окончания', 'Предмет', 'Преподаватель', 'Группа', 'Аудитория'],
    ['Понедельник', '9:00', '10:20', 'Математика', 'Иванов И.И.', 'ИТ-21', '101'],
    ['Понедельник', '10:30', '11:50', 'Программирование', 'Петров П.П.', 'ИТ-21', 'Лаб-1'],
    ['Понедельник', '9:00', '10:20', 'Базы данных', 'Сидоров С.С.', 'ИТ-22', '102'],
    ['Вторник', '9:00', '10:20', 'Английский язык', 'Смирнова А.А.', 'ЭК-21', '201'],
    [''],
    ['ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ:'],
    ['1. Каждое занятие - отдельная строка'],
    ['2. День недели: Понедельник, Вторник, Среда, Четверг, Пятница, Суббота'],
    ['3. Время в формате Ч:ММ (например: 9:00)'],
    ['4. Заполняйте все поля для каждого занятия'],
    [''],
    ['ПУСТЫЕ СТРОКИ ДЛЯ ЗАПОЛНЕНИЯ:'],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '']
  ];

  return {
    name: 'Простая таблица',
    filename: 'template_simple_table.xlsx',
    description: 'Каждое занятие в отдельной строке. Легко заполнять построчно.',
    data
  };
}

// Вариант 4: Горизонтальный формат с отдельными столбцами (20 групп с реальными данными)
export function createTeacherTimeMatrix(): TemplateVariant {
  // Создаем список групп из реального расписания
  const groups = [
    'МЕТ-11', 'МТ-11', 'ЕкДл-11', 'А-11', 'МЕТ-21', 'МТ-21', 'ЕкДл-21', 'А-21',
    'МЕТ-31', 'МТ-31', 'ЕкДл-31', 'А-31', 'ІТ-11', 'ІТ-21', 'ІТ-31', 'КН-11',
    'КН-21', 'КН-31', 'ФК-11', 'ФК-21'
  ];

  // Создаем заголовок
  const headerRow1 = ['РОЗКЛАД ЗАНЯТЬ - ГОРИЗОНТАЛЬНИЙ ФОРМАТ'];
  const headerRow2 = ['Час'];
  const headerRow3 = ['ПОНЕДІЛЬОК'];

  // Добавляем группы и подзаголовки
  groups.forEach(group => {
    headerRow1.push(group, '', '');
    headerRow2.push(group, '', '');
    headerRow3.push('Предмет', 'Викладач', 'Аудиторія');
  });

  // Функция для создания строки с данными
  const createDataRow = (timeSlot: string, schedule: any) => {
    const row = [timeSlot];
    groups.forEach(group => {
      const lesson = schedule[group];
      if (lesson) {
        row.push(lesson.subject, lesson.teacher, lesson.classroom);
      } else {
        row.push('', '', '');
      }
    });
    return row;
  };

  const createDayRow = (day: string) => {
    const row = [day];
    groups.forEach(() => {
      row.push('', '', '');
    });
    return row;
  };

  // Реальные данные из расписания
  const mondaySchedule = {
    '10:30-11:50': {
      'МЕТ-11': { subject: 'Інформатика', teacher: 'Ленченко О.А.', classroom: 'комп.клас' },
      'МТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
      'ЕкДл-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
      'А-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' }
    },
    '12:10-13:30': {
      'МЕТ-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
      'МТ-11': { subject: 'Інформатика', teacher: 'Глушко Л.М.', classroom: 'комп.клас' },
      'ЕкДл-11': { subject: 'Математика', teacher: 'Тимкіна Л.Л.', classroom: 'ауд.20' },
      'А-11': { subject: 'Математика', teacher: 'Одинець А.М.', classroom: 'ауд.18' }
    }
  };

  const data = [
    headerRow1,
    [''],
    headerRow2,
    headerRow3,
    createDataRow('9:00-10:20', {
      'МТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'ЕкДл-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
    }),
    createDataRow('10:30-11:50', mondaySchedule['10:30-11:50']),
    createDataRow('12:10-13:30', mondaySchedule['12:10-13:30']),
    createDataRow('13:40-15:00', {
      'МЕТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'ЕкДл-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
      'А-11': { subject: 'Іноземна мова', teacher: 'Підручна А.В.', classroom: 'ауд.12' }
    }),
    createDayRow('ВІВТОРОК'),
    createDataRow('9:00-10:20', {
      'МЕТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
      'МТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
      'ЕкДл-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' }
    }),
    createDataRow('10:30-11:50', {
      'МЕТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
      'МТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
      'ЕкДл-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' },
      'А-11': { subject: 'Історія України', teacher: 'Самотгуга О.А.', classroom: 'ауд.10' }
    }),
    createDataRow('12:10-13:30', {
      'МЕТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
      'МТ-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
      'ЕкДл-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
      'А-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' }
    }),
    createDataRow('13:40-15:00', {
      'МЕТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
      'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
      'ЕкДл-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'А-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' }
    }),
    createDataRow('15:10-16:30', {
      'МТ-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
    }),
    createDayRow('СЕРЕДА'),
    createDataRow('9:00-10:20', {
      'МТ-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'А-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
    }),
    createDataRow('10:30-11:50', {
      'МЕТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
      'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
      'ЕкДл-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'А-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' }
    }),
    createDataRow('12:10-13:30', {
      'МЕТ-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
      'МТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
      'ЕкДл-11': { subject: 'Інформатика', teacher: 'Ленченко О.А.', classroom: 'комп.клас' },
      'А-11': { subject: 'Математика', teacher: 'Одинець А.М.', classroom: 'ауд.18' }
    }),
    createDayRow('ЧЕТВЕР'),
    createDayRow('П\'ЯТНИЦЯ'),
    [''],
    ['ІНСТРУКЦІЯ ПО ЗАПОВНЕННЮ:'],
    ['1. Заповнюйте окремо кожен стовпець для кожної групи'],
    ['2. Предмет - в перший стовпець групи'],
    ['3. Викладач - в другий стовпець групи'],
    ['4. Аудиторія - в третій стовпець групи'],
    ['5. Якщо заняття немає - залишайте всі три клітинки порожніми'],
    ['6. Реальні дані з розкладу Таврического коледжу 2024-2025 н.р.']
  ];

  return {
    name: 'Відокремлені стовпці (20 груп)',
    filename: 'template_separate_columns.xlsx',
    description: 'Горизонтальний формат з відокремленими стовпцями для 20 груп з реальними даними.',
    data
  };
}

// Вариант 5: Демо шаблон с 5 группами для примера
export function createDemoTemplate(): TemplateVariant {
  const groups = ['ИТ-21', 'ИТ-22', 'ЭК-21', 'А-21', 'М-21'];

  const headerRow1 = ['РАСПИСАНИЕ ЗАНЯТИЙ (ДЕМО - 5 ГРУПП)'];
  const headerRow2 = ['Время'];
  const headerRow3 = ['ПОНЕДЕЛЬНИК'];

  groups.forEach(group => {
    headerRow1.push(group, '', '');
    headerRow2.push(group, '', '');
    headerRow3.push('Предмет', 'Преподаватель', 'Аудитория');
  });

  const createEmptyRow = (timeSlot: string) => {
    const row = [timeSlot];
    groups.forEach(() => {
      row.push('', '', '');
    });
    return row;
  };

  const createDayRow = (day: string) => {
    const row = [day];
    groups.forEach(() => {
      row.push('', '', '');
    });
    return row;
  };

  // Добавляем пример заполнения
  const createExampleRow = (timeSlot: string) => {
    const row = [timeSlot];
    row.push('Математика', 'Иванов И.И.', 'каб.101'); // ИТ-21
    row.push('', '', ''); // ИТ-22
    row.push('Экономика', 'Петров П.П.', 'каб.201'); // ЭК-21
    row.push('', '', ''); // А-21
    row.push('', '', ''); // М-21
    return row;
  };

  const data = [
    headerRow1,
    [''],
    headerRow2,
    headerRow3,
    createExampleRow('9:00-10:20'),
    createEmptyRow('10:30-11:50'),
    createEmptyRow('12:10-13:30'),
    createEmptyRow('13:40-15:00'),
    createDayRow('ВТОРНИК'),
    createEmptyRow('9:00-10:20'),
    createEmptyRow('10:30-11:50'),
    createEmptyRow('12:10-13:30'),
    createEmptyRow('13:40-15:00'),
    createEmptyRow('15:10-16:30'),
    [''],
    ['ИНСТРУКЦИЯ:'],
    ['1. Каждая группа имеет 3 столбца: Предмет | Преподаватель | Аудитория'],
    ['2. Заголовки групп объединены в одну ячейку'],
    ['3. Заполняйте только нужные ячейки, пустые оставляйте незаполненными'],
    ['4. Этот шаблон показывает принцип работы для любого количества групп']
  ];

  return {
    name: 'Демо 5 групп',
    filename: 'template_demo_5groups.xlsx',
    description: 'Демонстрационный шаблон с 5 группами. Показывает принцип работы с объединенными ячейками.',
    data
  };
}

// Вариант 6: Вертикальный шаблон с реальными данными (группы по 4 в ряду)
export function createVerticalTemplate(): TemplateVariant {
  // Создаем группы по 4 в ряду из реального расписания
  const allGroups = [
    'МЕТ-11', 'МТ-11', 'ЕкДл-11', 'А-11',
    'МЕТ-21', 'МТ-21', 'ЕкДл-21', 'А-21',
    'МЕТ-31', 'МТ-31', 'ЕкДл-31', 'А-31',
    'ІТ-11', 'ІТ-21', 'ІТ-31', 'КН-11',
    'КН-21', 'КН-31', 'ФК-11', 'ФК-21'
  ];

  const data = [];
  
  // Заголовок
  data.push(['РОЗКЛАД ЗАНЯТЬ - ВЕРТИКАЛЬНИЙ ФОРМАТ (ГРУПИ ПО 4 В РЯДУ)']);
  data.push(['']);

  // Функция для создания строки с данными
  const createDataRow = (timeSlot: string, schedule: any) => {
    const row = [timeSlot];
    for (let i = 0; i < 4; i++) {
      const group = schedule.groups[i];
      const lesson = schedule.lessons[group];
      if (lesson) {
        row.push(lesson.subject, lesson.teacher, lesson.classroom);
      } else {
        row.push('', '', '');
      }
    }
    return row;
  };

  // Обрабатываем группы по 4 штуки
  for (let groupIndex = 0; groupIndex < allGroups.length; groupIndex += 4) {
    const currentGroups = allGroups.slice(groupIndex, groupIndex + 4);
    
    // Заголовок групп
    const groupHeaderRow = ['Час'];
    currentGroups.forEach(group => {
      groupHeaderRow.push(group, '', '');
    });
    data.push(groupHeaderRow);
    
    // Подзаголовки (Предмет, Викладач, Аудиторія)
    const subHeaderRow = [''];
    currentGroups.forEach(() => {
      subHeaderRow.push('Предмет', 'Викладач', 'Аудиторія');
    });
    data.push(subHeaderRow);
    
    // Реальные данные для первого блока групп (МЕТ-11, МТ-11, ЕкДл-11, А-11)
    if (groupIndex === 0) {
      // ПОНЕДІЛЬОК
      data.push(['ПОНЕДІЛЬОК', '', '', '', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'ЕкДл-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Інформатика', teacher: 'Ленченко О.А.', classroom: 'комп.клас' },
          'МТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'ЕкДл-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
          'А-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
          'МТ-11': { subject: 'Інформатика', teacher: 'Глушко Л.М.', classroom: 'комп.клас' },
          'ЕкДл-11': { subject: 'Математика', teacher: 'Тимкіна Л.Л.', classroom: 'ауд.20' },
          'А-11': { subject: 'Математика', teacher: 'Одинець А.М.', classroom: 'ауд.18' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'ЕкДл-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'А-11': { subject: 'Іноземна мова', teacher: 'Підручна А.В.', classroom: 'ауд.12' }
        }
      }));
      data.push(['']);

      // ВІВТОРОК
      data.push(['ВІВТОРОК', '', '', '', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
          'МТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'ЕкДл-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'МТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
          'ЕкДл-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' },
          'А-11': { subject: 'Історія України', teacher: 'Самотгуга О.А.', classroom: 'ауд.10' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'МТ-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'ЕкДл-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'А-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
          'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'ЕкДл-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'А-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' }
        }
      }));
      data.push(createDataRow('15:10-16:30', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(['']);

      // СЕРЕДА
      data.push(['СЕРЕДА', '', '', '', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'А-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'ЕкДл-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'А-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' }
        }
      }));
      data.push(['']);
    } else {
      // Для остальных блоков создаем пустые строки
      const days = ['ПОНЕДІЛЬОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', 'П\'ЯТНИЦЯ'];
      const timeSlots = ['9:00-10:20', '10:30-11:50', '12:10-13:30', '13:40-15:00', '15:10-16:30'];
      
      days.forEach(day => {
        // День недели
        const dayRow = [day];
        currentGroups.forEach(() => {
          dayRow.push('', '', '');
        });
        data.push(dayRow);
        
        // Временные слоты
        timeSlots.forEach(timeSlot => {
          const timeRow = [timeSlot];
          currentGroups.forEach(() => {
            timeRow.push('', '', '');
          });
          data.push(timeRow);
        });
        
        // Пустая строка между днями
        const emptyRow = [''];
        currentGroups.forEach(() => {
          emptyRow.push('', '', '');
        });
        data.push(emptyRow);
      });
    }
    
    // Разделитель между блоками групп
    if (groupIndex + 4 < allGroups.length) {
      data.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
      data.push(['='.repeat(60)]);
      data.push(['']);
    }
  }
  
  // Инструкция
  data.push(['']);
  data.push(['ІНСТРУКЦІЯ ПО ЗАПОВНЕННЮ:']);
  data.push(['1. Групи розташовані блоками по 4 штуки']);
  data.push(['2. Кожна група має 3 стовпці: Предмет | Викладач | Аудиторія']);
  data.push(['3. Прокручуйте вниз щоб побачити наступні блоки груп']);
  data.push(['4. Заповнюйте тільки потрібні клітинки, порожні залишайте незаповненими']);
  data.push(['5. Реальні дані з розкладу Таврического коледжу 2024-2025 н.р.']);

  return {
    name: 'Вертикальний (групи по 4)',
    filename: 'template_vertical_4groups.xlsx',
    description: 'Вертикальний формат з групами по 4 в ряду з реальними даними колледжу.',
    data
  };
}

// Вариант 7: Вертикальный шаблон с группами по 3 в ряду
export function createVertical3GroupsTemplate(): TemplateVariant {
  // Создаем группы по 3 в ряду из реального расписания
  const allGroups = [
    'МЕТ-11', 'МТ-11', 'ЕкДл-11',
    'А-11', 'МЕТ-21', 'МТ-21',
    'ЕкДл-21', 'А-21', 'МЕТ-31',
    'МТ-31', 'ЕкДл-31', 'А-31',
    'ІТ-11', 'ІТ-21', 'ІТ-31',
    'КН-11', 'КН-21', 'КН-31',
    'ФК-11', 'ФК-21', 'СП-11'
  ];

  const data = [];
  
  // Заголовок
  data.push(['РОЗКЛАД ЗАНЯТЬ - ВЕРТИКАЛЬНИЙ ФОРМАТ (ГРУПИ ПО 3 В РЯДУ)']);
  data.push(['']);

  // Функция для создания строки с данными
  const createDataRow = (timeSlot: string, schedule: any) => {
    const row = [timeSlot];
    for (let i = 0; i < 3; i++) {
      const group = schedule.groups[i];
      const lesson = schedule.lessons[group];
      if (lesson) {
        row.push(lesson.subject, lesson.teacher, lesson.classroom);
      } else {
        row.push('', '', '');
      }
    }
    return row;
  };

  // Обрабатываем группы по 3 штуки
  for (let groupIndex = 0; groupIndex < allGroups.length; groupIndex += 3) {
    const currentGroups = allGroups.slice(groupIndex, groupIndex + 3);
    
    // Заголовок групп
    const groupHeaderRow = ['Час'];
    currentGroups.forEach(group => {
      groupHeaderRow.push(group, '', '');
    });
    data.push(groupHeaderRow);
    
    // Подзаголовки (Предмет, Викладач, Аудиторія)
    const subHeaderRow = [''];
    currentGroups.forEach(() => {
      subHeaderRow.push('Предмет', 'Викладач', 'Аудиторія');
    });
    data.push(subHeaderRow);
    
    // Реальные данные для первого блока групп (МЕТ-11, МТ-11, ЕкДл-11)
    if (groupIndex === 0) {
      // ПОНЕДІЛЬОК
      data.push(['ПОНЕДІЛЬОК', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'ЕкДл-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Інформатика', teacher: 'Ленченко О.А.', classroom: 'комп.клас' },
          'МТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'ЕкДл-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
          'МТ-11': { subject: 'Інформатика', teacher: 'Глушко Л.М.', classroom: 'комп.клас' },
          'ЕкДл-11': { subject: 'Математика', teacher: 'Тимкіна Л.Л.', classroom: 'ауд.20' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'ЕкДл-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' }
        }
      }));
      data.push(['']);

      // ВІВТОРОК
      data.push(['ВІВТОРОК', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
          'МТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'ЕкДл-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'МТ-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
          'ЕкДл-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'МТ-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'ЕкДл-11': { subject: 'Громадянська освіта', teacher: 'Фуртат С.О.', classroom: 'ауд.14' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
          'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'ЕкДл-11': { subject: 'Біологія і екологія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' }
        }
      }));
      data.push(createDataRow('15:10-16:30', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(['']);

      // СЕРЕДА
      data.push(['СЕРЕДА', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МТ-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Українська мова', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' },
          'МТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'ЕкДл-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Географія', teacher: 'Алєксахіна О.Г.', classroom: 'ауд.8' },
          'МТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
          'ЕкДл-11': { subject: 'Інформатика', teacher: 'Ленченко О.А.', classroom: 'комп.клас' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Зарубіжна література', teacher: 'Галка Л.Ф.', classroom: 'ауд.22' },
          'МТ-11': { subject: 'Іноземна мова', teacher: 'Носуля Н.І.', classroom: 'ауд.12' },
          'ЕкДл-11': { subject: 'Українська література', teacher: 'Дехтярчук В.В.', classroom: 'ауд.15' }
        }
      }));
      data.push(['']);

      // ЧЕТВЕР
      data.push(['ЧЕТВЕР', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Фізична культура', teacher: 'Тарнавський А.М.', classroom: 'спортзал' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Фізика і астрономія', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
          'МТ-11': { subject: 'Зарубіжна література', teacher: 'Галка Л.Ф.', classroom: 'ауд.22' },
          'ЕкДл-11': { subject: 'Історія України', teacher: 'Любченко Л.В.', classroom: 'ауд.10' }
        }
      }));
      data.push(createDataRow('12:10-13:30', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Математика', teacher: 'Тараненко О.С.', classroom: 'ауд.20' },
          'МТ-11': { subject: 'Всесвітня історія', teacher: 'Пустовойт Л.А.', classroom: 'ауд.11' },
          'ЕкДл-11': { subject: 'Зарубіжна література', teacher: 'Галка Л.Ф.', classroom: 'ауд.22' }
        }
      }));
      data.push(createDataRow('13:40-15:00', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Виховна година', teacher: 'Плешивцева І.А.', classroom: 'ауд.16' },
          'МТ-11': { subject: 'Виховна година', teacher: 'Сарнавська Л.В.', classroom: 'ауд.25' },
          'ЕкДл-11': { subject: 'Виховна година', teacher: 'Капран В.Н.', classroom: 'ауд.18' }
        }
      }));
      data.push(['']);

      // П'ЯТНИЦЯ
      data.push(['П\'ЯТНИЦЯ', '', '', '', '', '', '', '', '', '']);
      data.push(createDataRow('9:00-10:20', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Всесвітня історія', teacher: 'Любченко Л.В.', classroom: 'ауд.10' },
          'ЕкДл-11': { subject: 'Хімія', teacher: 'Голіяд Р.О.', classroom: 'лаб.хім' }
        }
      }));
      data.push(createDataRow('10:30-11:50', {
        groups: currentGroups,
        lessons: {
          'МЕТ-11': { subject: 'Захист України', teacher: 'Фуртат С.О.', classroom: 'ауд.14' },
          'МТ-11': { subject: 'Хімія', teacher: 'Голіяд Р.О.', classroom: 'лаб.хім' },
          'ЕкДл-11': { subject: 'Математика', teacher: 'Тимкіна Л.Л.', classroom: 'ауд.20' }
        }
      }));
      data.push(['']);
    } else {
      // Для остальных блоков создаем пустые строки
      const days = ['ПОНЕДІЛЬОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', 'П\'ЯТНИЦЯ'];
      const timeSlots = ['9:00-10:20', '10:30-11:50', '12:10-13:30', '13:40-15:00', '15:10-16:30'];
      
      days.forEach(day => {
        // День недели
        const dayRow = [day];
        currentGroups.forEach(() => {
          dayRow.push('', '', '');
        });
        data.push(dayRow);
        
        // Временные слоты
        timeSlots.forEach(timeSlot => {
          const timeRow = [timeSlot];
          currentGroups.forEach(() => {
            timeRow.push('', '', '');
          });
          data.push(timeRow);
        });
        
        // Пустая строка между днями
        const emptyRow = [''];
        currentGroups.forEach(() => {
          emptyRow.push('', '', '');
        });
        data.push(emptyRow);
      });
    }
    
    // Разделитель между блоками групп
    if (groupIndex + 3 < allGroups.length) {
      data.push(['', '', '', '', '', '', '', '', '', '']);
      data.push(['='.repeat(45)]);
      data.push(['']);
    }
  }
  
  // Инструкция
  data.push(['']);
  data.push(['ІНСТРУКЦІЯ ПО ЗАПОВНЕННЮ:']);
  data.push(['1. Групи розташовані блоками по 3 штуки']);
  data.push(['2. Кожна група має 3 стовпці: Предмет | Викладач | Аудиторія']);
  data.push(['3. Прокручуйте вниз щоб побачити наступні блоки груп']);
  data.push(['4. Заповнюйте тільки потрібні клітинки']);
  data.push(['5. Реальні дані з розкладу Таврического коледжу 2024-2025 н.р.']);

  return {
    name: 'Вертикальний (групи по 3)',
    filename: 'template_vertical_3groups.xlsx',
    description: 'Вертикальний формат з групами по 3 в ряду з реальними даними колледжу.',
    data
  };
}

export function generateAllTemplates(): TemplateVariant[] {
  return [
    createWeeklyTemplate(),
    createSimpleListTemplate(),
    createGroupBasedTemplate(),
    createTeacherTimeMatrix(),
    createDemoTemplate(),
    createVerticalTemplate(),
    createVertical3GroupsTemplate()
  ];
}

export function saveTemplateToFile(template: TemplateVariant, outputDir: string = './templates'): string {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(template.data);

  // Настройки для разных шаблонов
  if (template.filename === 'template_separate_columns.xlsx') {
    // Специальные настройки для шаблона с отдельными столбцами (20 групп)
    const cols = [{ width: 12 }]; // Время
    for (let i = 0; i < 20; i++) {
      cols.push({ width: 15 }); // Предмет
      cols.push({ width: 20 }); // Преподаватель  
      cols.push({ width: 12 }); // Аудитория
    }
    ws['!cols'] = cols;
    
    // Объединение ячеек для заголовков групп (20 групп)
    const merges = [];
    for (let i = 0; i < 20; i++) {
      const startCol = 1 + (i * 3);
      const endCol = startCol + 2;
      merges.push({ s: { c: startCol, r: 2 }, e: { c: endCol, r: 2 } });
    }
    ws['!merges'] = merges;
  } else if (template.filename === 'template_demo_5groups.xlsx') {
    // Настройки для демо шаблона с 5 группами
    const cols = [{ width: 12 }]; // Время
    for (let i = 0; i < 5; i++) {
      cols.push({ width: 15 }); // Предмет
      cols.push({ width: 20 }); // Преподаватель  
      cols.push({ width: 12 }); // Аудитория
    }
    ws['!cols'] = cols;
    
    // Объединение ячеек для заголовков групп (5 групп)
    const merges = [];
    for (let i = 0; i < 5; i++) {
      const startCol = 1 + (i * 3);
      const endCol = startCol + 2;
      merges.push({ s: { c: startCol, r: 2 }, e: { c: endCol, r: 2 } });
    }
    ws['!merges'] = merges;
  } else if (template.filename === 'template_vertical_4groups.xlsx') {
    // Настройки для вертикального шаблона с группами по 4
    ws['!cols'] = [
      { width: 12 }, // Время
      { width: 15 }, { width: 20 }, { width: 12 }, // Группа 1
      { width: 15 }, { width: 20 }, { width: 12 }, // Группа 2
      { width: 15 }, { width: 20 }, { width: 12 }, // Группа 3
      { width: 15 }, { width: 20 }, { width: 12 }  // Группа 4
    ];
    
    // Находим все строки с заголовками групп и создаем объединения
    const merges = [];
    const rows = template.data;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (row && row.length > 1 && typeof row[1] === 'string' && 
          (row[1].includes('ИТ-') || row[1].includes('ЭК-') || row[1].includes('А-') || row[1].includes('М-'))) {
        // Это строка с заголовками групп, создаем объединения
        for (let groupIndex = 0; groupIndex < 4; groupIndex++) {
          const startCol = 1 + (groupIndex * 3);
          const endCol = startCol + 2;
          if (startCol < row.length) {
            merges.push({ s: { c: startCol, r: rowIndex }, e: { c: endCol, r: rowIndex } });
          }
        }
      }
    }
    ws['!merges'] = merges;
  } else if (template.filename === 'template_vertical_3groups.xlsx') {
    // Настройки для вертикального шаблона с группами по 3
    ws['!cols'] = [
      { width: 12 }, // Время
      { width: 15 }, { width: 20 }, { width: 12 }, // Группа 1
      { width: 15 }, { width: 20 }, { width: 12 }, // Группа 2
      { width: 15 }, { width: 20 }, { width: 12 }  // Группа 3
    ];
    
    // Находим все строки с заголовками групп и создаем объединения
    const merges = [];
    const rows = template.data;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (row && row.length > 1 && typeof row[1] === 'string' && 
          (row[1].includes('МЕТ-') || row[1].includes('МТ-') || row[1].includes('ЕкДл-') || 
           row[1].includes('А-') || row[1].includes('ІТ-') || row[1].includes('КН-') || 
           row[1].includes('ФК-') || row[1].includes('СП-'))) {
        // Это строка с заголовками групп, создаем объединения
        for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
          const startCol = 1 + (groupIndex * 3);
          const endCol = startCol + 2;
          if (startCol < row.length) {
            merges.push({ s: { c: startCol, r: rowIndex }, e: { c: endCol, r: rowIndex } });
          }
        }
      }
    }
    ws['!merges'] = merges;
  } else {
    // Стандартные настройки
    ws['!cols'] = [
      { width: 15 }, { width: 25 }, { width: 25 }, { width: 25 },
      { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Расписание');

  const filePath = join(outputDir, template.filename);
  XLSX.writeFile(wb, filePath);
  
  return filePath;
}