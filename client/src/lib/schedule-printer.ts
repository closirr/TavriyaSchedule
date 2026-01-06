/**
 * SchedulePrinter - модуль для генерації та друку розкладу занять
 * 
 * Адаптовано з print_integration/schedule-print.js для використання в React
 * 
 * @example
 * const printer = new SchedulePrinter({ groupsPerPage: 4 });
 * printer.print(scheduleData);
 */

import type { Lesson } from '@/types/schedule';

/**
 * Дані для одного уроку в форматі принтера
 */
interface PrinterLessonData {
  subject: string;
  teacher: string;
}

/**
 * Дані для комірки - може бути звичайний урок або "мигалка" (split)
 * Мигалка - комірка розділена вертикальною лінією:
 * - ліва частина (week1) - предмет для 1-го тижня (чисельник)
 * - права частина (week2) - предмет для 2-го тижня (знаменник)
 */
interface PrinterCellData {
  /** Звичайний урок (без розділення по тижнях) */
  single?: PrinterLessonData;
  /** Урок для 1-го тижня (ліва частина мигалки) */
  week1?: PrinterLessonData;
  /** Урок для 2-го тижня (права частина мигалки) */
  week2?: PrinterLessonData;
}

/**
 * Дані для одного слоту часу
 */
interface PrinterTimeSlot {
  number: number;
  time: string;
  groups: Record<string, PrinterCellData>;
}

/**
 * Формат даних для принтера
 */
export interface PrinterScheduleData {
  semester: string;
  directorName: string;
  groups: string[];
  schedule: Record<string, PrinterTimeSlot[]>;
}

/**
 * Конфігурація принтера
 */
interface PrinterConfig {
  groupsPerPage: number;
  excludeDays: string[];
  days: string[];
}

const DEFAULT_CONFIG: PrinterConfig = {
  groupsPerPage: 4,
  excludeDays: ['СУБОТА'],
  days: ['ПОНЕДІЛОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', "П'ЯТНИЦЯ", 'СУБОТА'],
};

/**
 * Автоматично визначає поточний семестр та навчальний рік
 * 
 * Логіка:
 * - Навчальний рік: вересень поточного року - червень наступного року
 * - 1 семестр: вересень - грудень
 * - 2 семестр: січень - червень
 * - Літо (липень-серпень): показуємо наступний навчальний рік, 1 семестр
 * 
 * @returns Рядок у форматі "X семестр YYYY–YYYY н.р."
 */
export function getCurrentSemesterString(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (січень = 0)
  const year = now.getFullYear();
  
  let semester: number;
  let academicYearStart: number;
  let academicYearEnd: number;
  
  if (month >= 8) {
    // Вересень - Грудень: 1 семестр поточного навчального року
    semester = 1;
    academicYearStart = year;
    academicYearEnd = year + 1;
  } else if (month >= 0 && month <= 5) {
    // Січень - Червень: 2 семестр
    semester = 2;
    academicYearStart = year - 1;
    academicYearEnd = year;
  } else {
    // Липень - Серпень: канікули, показуємо наступний навчальний рік
    semester = 1;
    academicYearStart = year;
    academicYearEnd = year + 1;
  }
  
  return `${semester} семестр ${academicYearStart}–${academicYearEnd} н.р.`;
}

/**
 * Маппінг днів тижня з формату Lesson до формату принтера
 */
const DAY_MAP: Record<string, string> = {
  'Понеділок': 'ПОНЕДІЛОК',
  'Вівторок': 'ВІВТОРОК',
  'Середа': 'СЕРЕДА',
  'Четвер': 'ЧЕТВЕР',
  "П'ятниця": "П'ЯТНИЦЯ",
  'Субота': 'СУБОТА',
};

/**
 * Витягує унікальні часові слоти з уроків та сортує їх
 */
function extractTimeSlots(lessons: Lesson[]): { startTime: string; endTime: string; time: string }[] {
  const timeMap = new Map<string, { startTime: string; endTime: string }>();
  
  for (const lesson of lessons) {
    if (lesson.startTime && lesson.endTime) {
      const key = lesson.startTime;
      if (!timeMap.has(key)) {
        timeMap.set(key, { startTime: lesson.startTime, endTime: lesson.endTime });
      }
    }
  }
  
  // Сортуємо за часом початку
  const sorted = Array.from(timeMap.values()).sort((a, b) => {
    const [aH, aM] = a.startTime.split(':').map(Number);
    const [bH, bM] = b.startTime.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });
  
  // Форматуємо час для відображення
  return sorted.map(slot => ({
    ...slot,
    time: `${slot.startTime.replace(/^0/, '')}–${slot.endTime.replace(/^0/, '')}`,
  }));
}

/**
 * Конвертує масив Lesson[] у формат PrinterScheduleData
 */
export function convertLessonsToPrinterFormat(
  lessons: Lesson[],
  semester?: string,
  directorName?: string
): PrinterScheduleData {
  console.log('[PRINTER] Converting lessons:', lessons.length);
  
  // Отримуємо унікальні групи
  const groups = Array.from(new Set(lessons.map(l => l.group))).sort();
  console.log('[PRINTER] Groups found:', groups);
  
  // Динамічно витягуємо часові слоти з даних
  const timeSlots = extractTimeSlots(lessons);
  console.log('[PRINTER] Extracted time slots:', timeSlots);
  
  // Створюємо маппінг startTime -> номер пари
  const timeToNumber = new Map<string, number>();
  timeSlots.forEach((slot, index) => {
    timeToNumber.set(slot.startTime, index + 1);
    // Також додаємо варіант без провідного нуля
    const withoutLeadingZero = slot.startTime.replace(/^0/, '');
    timeToNumber.set(withoutLeadingZero, index + 1);
  });
  
  // Ініціалізуємо розклад
  const schedule: Record<string, PrinterTimeSlot[]> = {};
  
  // Групуємо уроки по днях
  for (const day of Object.values(DAY_MAP)) {
    schedule[day] = timeSlots.map((slot, index) => ({
      number: index + 1,
      time: slot.time,
      groups: {},
    }));
  }
  
  // Збираємо унікальні часи для debug
  const uniqueTimes = new Set(lessons.map(l => l.startTime));
  console.log('[PRINTER] Unique start times in lessons:', Array.from(uniqueTimes));
  
  // Збираємо унікальні дні для debug
  const uniqueDays = new Set(lessons.map(l => l.dayOfWeek));
  console.log('[PRINTER] Unique days in lessons:', Array.from(uniqueDays));
  
  let matchedLessons = 0;
  let unmatchedDays = 0;
  let unmatchedTimes = 0;
  
  // Заповнюємо розклад уроками
  for (const lesson of lessons) {
    const printerDay = DAY_MAP[lesson.dayOfWeek];
    if (!printerDay) {
      unmatchedDays++;
      console.log('[PRINTER] Day not found in DAY_MAP:', lesson.dayOfWeek);
      continue;
    }
    
    const lessonNumber = timeToNumber.get(lesson.startTime);
    if (!lessonNumber) {
      unmatchedTimes++;
      if (unmatchedTimes <= 5) {
        console.log('[PRINTER] Time not found in timeMap:', lesson.startTime);
      }
      continue;
    }
    
    const daySchedule = schedule[printerDay];
    const slot = daySchedule.find(s => s.number === lessonNumber);
    
    if (slot) {
      const lessonData: PrinterLessonData = {
        subject: lesson.subject,
        teacher: lesson.teacher,
      };
      
      // Ініціалізуємо комірку якщо ще не існує
      if (!slot.groups[lesson.group]) {
        slot.groups[lesson.group] = {};
      }
      
      const cell = slot.groups[lesson.group];
      
      if (lesson.weekNumber === 1) {
        // Урок для 1-го тижня (ліва частина мигалки)
        cell.week1 = lessonData;
        console.log(`[PRINTER] Week 1 lesson: ${lesson.group} - ${lesson.subject} (${lesson.dayOfWeek} ${lesson.startTime})`);
      } else if (lesson.weekNumber === 2) {
        // Урок для 2-го тижня (права частина мигалки)
        cell.week2 = lessonData;
        console.log(`[PRINTER] Week 2 lesson: ${lesson.group} - ${lesson.subject} (${lesson.dayOfWeek} ${lesson.startTime})`);
      } else {
        // Звичайний урок без розділення по тижнях
        cell.single = lessonData;
      }
      
      matchedLessons++;
    }
  }
  
  // Debug: показати всі мигалки
  for (const [day, slots] of Object.entries(schedule)) {
    for (const slot of slots) {
      for (const [group, cell] of Object.entries(slot.groups)) {
        if (cell.week1 || cell.week2) {
          console.log(`[PRINTER] Split cell found: ${day} ${slot.time} ${group}`, {
            week1: cell.week1,
            week2: cell.week2,
          });
        }
      }
    }
  }
  
  console.log('[PRINTER] Matched lessons:', matchedLessons);
  console.log('[PRINTER] Unmatched days:', unmatchedDays);
  console.log('[PRINTER] Unmatched times:', unmatchedTimes);
  
  // Видаляємо порожні слоти (де немає жодного уроку)
  for (const day of Object.keys(schedule)) {
    schedule[day] = schedule[day].filter(slot => 
      Object.keys(slot.groups).length > 0
    );
  }
  
  return {
    semester: semester || getCurrentSemesterString(),
    directorName: directorName || 'Маргарита РОМАНОВА',
    groups,
    schedule,
  };
}

/**
 * Екранує HTML символи
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Генерує CSS стилі для друку
 */
function getStyles(): string {
  return `
    @page {
      size: A4 landscape;
      margin: 10mm;
      /* Прибираємо стандартні колонтитули браузера */
      margin-top: 10mm;
      margin-bottom: 10mm;
    }
    
    @page {
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }
    
    .section-separator {
      height: 20px;
      border-bottom: 2px dashed #999;
      margin: 15px 0;
    }

    .signatures-block {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 11px;
      padding: 0 10px;
    }

    .signature-item {
      display: inline-flex;
      align-items: baseline;
      flex-wrap: nowrap;
    }

    .signature-item .label {
      white-space: nowrap;
    }

    .signature-item .line {
      display: inline-block;
      width: 80px;
      border-bottom: 1px solid #000;
      margin-left: 5px;
      margin-right: 5px;
    }

    .signature-item .name {
      white-space: nowrap;
    }

    @media print {
      .signatures-block {
        display: flex !important;
        justify-content: space-between !important;
      }
      .signature-item {
        display: inline-flex !important;
      }
    }

    @media print {
      #printBtn { display: none; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .day-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .day-block {
        page-break-before: auto;
        break-before: auto;
      }
      
      /* Заборона розриву рядків таблиці */
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      td, th {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .schedule-block {
        page-break-inside: auto;
      }
      
      .day-table {
        page-break-inside: auto;
      }
      
      /* Заголовок таблиці не відривається від даних */
      thead {
        display: table-header-group;
      }
      
      /* Підписи не відриваються від таблиці */
      .signatures-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .section-separator {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: "Times New Roman", serif;
      font-size: 11px;
      margin: 0;
      padding: 0;
    }

    #wrapper {
      width: 100%;
      margin: 0 auto;
    }

    .top-line {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      margin-right: 10px;
      font-size: 11px;
    }

    .approve-block {
      text-align: right;
      line-height: 1.3;
    }

    .approve-block .line {
      display: inline-block;
      min-width: 120px;
      border-bottom: 1px solid #000;
      margin-left: 4px;
    }

    .title-block {
      text-align: center;
      margin-top: 10px;
      margin-bottom: 5px;
    }

    .title-block h1 {
      font-size: 20px;
      margin: 0;
      font-weight: bold;
    }

    .title-block div {
      margin-top: 4px;
    }

    #printBtn {
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
    }

    .print-controls {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1000;
      background: #fff;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .print-hint {
      position: fixed;
      top: 15px;
      left: 100px;
      z-index: 1000;
      margin: 0;
      font-size: 11px;
      color: #666;
      max-width: 350px;
      background: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    @media print {
      .print-controls { display: none; }
      .print-hint { display: none; }
    }

    .col-days { width: 26px; }
    .col-number { width: 20px; }
    .col-time { width: 60px; }

    .day-cell {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-weight: bold;
      font-size: 12px;
    }

    .time-cell { font-size: 10px; }

    .day-separator td {
      border-top: 2px solid #000 !important;
    }
    
    .day-last-row td {
      border-bottom: 2px solid #000 !important;
    }

    .subject {
      font-size: 11px;
      font-weight: bold;
    }

    .teacher {
      font-size: 9px;
      font-style: italic;
    }

    /* Стилі для мигалок - комірок з двома предметами */
    .split-cell {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 40px;
    }
    
    .split-cell .week-part {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2px;
    }
    
    .split-cell .week-part.week1 {
      border-right: 1px solid #000;
    }
    
    .split-cell .week-part.week2 {
      /* права частина без додаткової границі */
    }

    .day-block {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .schedule-block {
      margin-bottom: 5px;
    }
    
    .day-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 2px solid #000;
    }
    
    .day-table th,
    .day-table td {
      border: 1px solid #000;
      padding: 2px 3px;
      text-align: center;
      vertical-align: middle;
      word-wrap: break-word;
    }`;
}

/**
 * Генерує HTML блоки для днів
 */
function generateDayBlocks(scheduleData: PrinterScheduleData, config: PrinterConfig): string {
  const allGroups = scheduleData.groups;
  const { groupsPerPage, excludeDays, days } = config;
  let html = '';

  // Розбиваємо групи на чанки
  const groupChunks: string[][] = [];
  for (let i = 0; i < allGroups.length; i += groupsPerPage) {
    groupChunks.push(allGroups.slice(i, i + groupsPerPage));
  }

  // Дні без виключених
  const printDays = days.filter(d => !excludeDays.includes(d));

  // Для кожного чанку груп генеруємо повний розклад
  groupChunks.forEach((groups, chunkIndex) => {
    // Підписи та візуальний розділювач між секціями
    if (chunkIndex > 0) {
      html += `
        <div class="signatures-block">
          <div class="signature-item">
            <span class="label">Голова&nbsp;студ.ради</span>
            <span class="line"></span>
          </div>
          <div class="signature-item">
            <span class="label">Методист</span>
            <span class="name">&nbsp;Ірина&nbsp;ОЛІЙНИК</span>
            <span class="line"></span>
          </div>
          <div class="signature-item">
            <span class="label">Заступник&nbsp;директора&nbsp;з&nbsp;НВР</span>
            <span class="name">&nbsp;Людмила&nbsp;ПУСТОВОЙТ</span>
            <span class="line"></span>
          </div>
        </div>
        <div class="section-separator"></div>
      `;
    }

    // Генеруємо одну таблицю для всіх днів
    html += `
      <div class="schedule-block">
        <table class="day-table">
          <thead>
            <tr>
              <th class="col-days" rowspan="2">Дні</th>
              <th class="col-number" rowspan="2">№</th>
              <th class="col-time" rowspan="2">Час</th>
              <th colspan="${groups.length}">Групи</th>
            </tr>
            <tr>
              ${groups.map(g => `<th>${escapeHtml(g)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    printDays.forEach((day, dayIndex) => {
      const lessons = scheduleData.schedule[day];
      if (!lessons || lessons.length === 0) return;

      html += lessons.map((lesson, li) => {
        const isFirstRow = li === 0 && dayIndex > 0;
        const isLastRow = li === lessons.length - 1;
        const rowClasses = [
          isFirstRow ? 'day-separator' : '',
          isLastRow ? 'day-last-row' : ''
        ].filter(Boolean).join(' ');
        
        const groupCells = groups.map(group => {
          const cell = lesson.groups[group];
          if (!cell) return '<td></td>';
          
          // Перевіряємо чи це мигалка (є week1 або week2)
          const isSplit = cell.week1 || cell.week2;
          
          if (isSplit) {
            // Мигалка - комірка з вертикальним розділенням
            const week1Subject = cell.week1?.subject ? `<div class="subject">${escapeHtml(cell.week1.subject).replace(/\n/g, '<br>')}</div>` : '';
            const week1Teacher = cell.week1?.teacher ? `<div class="teacher">${escapeHtml(cell.week1.teacher)}</div>` : '';
            const week2Subject = cell.week2?.subject ? `<div class="subject">${escapeHtml(cell.week2.subject).replace(/\n/g, '<br>')}</div>` : '';
            const week2Teacher = cell.week2?.teacher ? `<div class="teacher">${escapeHtml(cell.week2.teacher)}</div>` : '';
            return `
              <td style="padding: 0;">
                <div class="split-cell">
                  <div class="week-part week1">
                    ${week1Subject}
                    ${week1Teacher}
                  </div>
                  <div class="week-part week2">
                    ${week2Subject}
                    ${week2Teacher}
                  </div>
                </div>
              </td>
            `;
          } else if (cell.single) {
            // Звичайна комірка
            const singleSubject = cell.single.subject ? `<div class="subject">${escapeHtml(cell.single.subject).replace(/\n/g, '<br>')}</div>` : '';
            const singleTeacher = cell.single.teacher ? `<div class="teacher">${escapeHtml(cell.single.teacher)}</div>` : '';
            return `
              <td>
                ${singleSubject}
                ${singleTeacher}
              </td>
            `;
          }
          return '<td></td>';
        }).join('');
        
        const dayCell = li === 0 ? `<td class="day-cell" rowspan="${lessons.length}">${day}</td>` : '';
        
        return `
        <tr class="${rowClasses}">
          ${dayCell}
          <td>${lesson.number}</td>
          <td class="time-cell">${lesson.time}</td>
          ${groupCells}
        </tr>
      `;
      }).join('');
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  // Додаємо підписи в кінці останнього блоку
  html += `
    <div class="signatures-block">
      <div class="signature-item">
        <span class="label">Голова&nbsp;студ.ради</span>
        <span class="line"></span>
      </div>
      <div class="signature-item">
        <span class="label">Методист</span>
        <span class="name">&nbsp;Ірина&nbsp;ОЛІЙНИК</span>
        <span class="line"></span>
      </div>
      <div class="signature-item">
        <span class="label">Заступник&nbsp;директора&nbsp;з&nbsp;НВР</span>
        <span class="name">&nbsp;Людмила&nbsp;ПУСТОВОЙТ</span>
        <span class="line"></span>
      </div>
    </div>
  `;

  return html;
}

/**
 * Клас для друку розкладу
 */
export class SchedulePrinter {
  private config: PrinterConfig;

  constructor(config: Partial<PrinterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Генерує HTML сторінку для друку
   */
  generateHTML(scheduleData: PrinterScheduleData): string {
    return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Розклад занять – ${scheduleData.semester}</title>
  <style>
${getStyles()}
  </style>
</head>
<body>
<div class="print-controls">
  <button id="printBtn" onclick="window.print()">Друк</button>
  <p class="print-hint">При друку вимкніть "Колонтитули" (Headers and footers) в налаштуваннях</p>
</div>

<div id="wrapper">
  <div class="top-line">
    <div class="approve-block">
      ЗАТВЕРДЖУЮ<br>
      Директор коледжу<br>
      ${escapeHtml(scheduleData.directorName)}<span class="line"></span>
    </div>
  </div>

  <div class="title-block">
    <h1>РОЗКЛАД ЗАНЯТЬ</h1>
    <div>на ${escapeHtml(scheduleData.semester)}</div>
  </div>

  ${generateDayBlocks(scheduleData, this.config)}
</div>

</body>
</html>`;
  }

  /**
   * Відкриває нове вікно з HTML для друку
   * Користувач може натиснути кнопку "Друк" на сторінці для друку
   */
  print(scheduleData: PrinterScheduleData): void {
    const printContent = this.generateHTML(scheduleData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  }
}
