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
 * Дані для одного слоту часу
 */
interface PrinterTimeSlot {
  number: number;
  time: string;
  groups: Record<string, PrinterLessonData>;
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
 * Стандартні часові слоти для пар (відповідно до розкладу коледжу)
 */
const TIME_SLOTS = [
  { number: 1, time: '9:00–10:20' },
  { number: 2, time: '10:30–11:50' },
  { number: 3, time: '12:10–13:30' },
  { number: 4, time: '13:40–15:00' },
  { number: 5, time: '15:10–16:30' },
  { number: 6, time: '16:40–18:00' },
];

/**
 * Визначає номер пари за часом початку
 */
function getLessonNumber(startTime: string): number {
  const timeMap: Record<string, number> = {
    '09:00': 1, '9:00': 1,
    '10:30': 2,
    '12:10': 3,
    '13:40': 4,
    '15:10': 5,
    '16:40': 6,
  };
  return timeMap[startTime] || 0;
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
  
  // Ініціалізуємо розклад
  const schedule: Record<string, PrinterTimeSlot[]> = {};
  
  // Групуємо уроки по днях
  for (const day of Object.values(DAY_MAP)) {
    schedule[day] = TIME_SLOTS.map(slot => ({
      number: slot.number,
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
    
    const lessonNumber = getLessonNumber(lesson.startTime);
    if (lessonNumber === 0) {
      unmatchedTimes++;
      if (unmatchedTimes <= 5) {
        console.log('[PRINTER] Time not found in timeMap:', lesson.startTime);
      }
      continue;
    }
    
    const daySchedule = schedule[printerDay];
    const slot = daySchedule.find(s => s.number === lessonNumber);
    
    if (slot) {
      slot.groups[lesson.group] = {
        subject: lesson.subject,
        teacher: lesson.teacher,
      };
      matchedLessons++;
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
    semester: semester || `${new Date().getFullYear()} н.р.`,
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
      size: A4 portrait;
      margin: 10mm;
    }
    
    .section-separator {
      height: 20px;
      border-bottom: 2px dashed #999;
      margin: 15px 0;
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

    .subject {
      font-size: 11px;
      font-weight: bold;
    }

    .teacher {
      font-size: 9px;
    }

    .day-block {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .day-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 2px solid #000;
      margin-bottom: 5px;
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
    // Візуальний розділювач між секціями
    if (chunkIndex > 0) {
      html += `<div class="section-separator"></div>`;
    }

    // Генеруємо таблиці для всіх днів
    printDays.forEach((day) => {
      const lessons = scheduleData.schedule[day];
      if (!lessons || lessons.length === 0) return;

      html += `
        <div class="day-block">
          <table class="day-table">
            <tr>
              <th class="col-days" rowspan="2">Дні</th>
              <th class="col-number" rowspan="2">№</th>
              <th class="col-time" rowspan="2">Час</th>
              <th colspan="${groups.length}">Групи</th>
            </tr>
            <tr>
              ${groups.map(g => `<th>${escapeHtml(g)}</th>`).join('')}
            </tr>
            ${lessons.map((lesson, li) => `
              <tr>
                ${li === 0 ? `<td class="day-cell" rowspan="${lessons.length}">${day}</td>` : ''}
                <td>${lesson.number}</td>
                <td class="time-cell">${lesson.time}</td>
                ${groups.map(group => `
                  <td>
                    ${lesson.groups[group]?.subject ? `<div class="subject">${escapeHtml(lesson.groups[group].subject).replace(/\n/g, '<br>')}</div>` : ''}
                    ${lesson.groups[group]?.teacher ? `<div class="teacher">${escapeHtml(lesson.groups[group].teacher)}</div>` : ''}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    });
  });

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
<button id="printBtn" onclick="window.print()">Друк</button>

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
   */
  print(scheduleData: PrinterScheduleData): void {
    const printContent = this.generateHTML(scheduleData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
}
