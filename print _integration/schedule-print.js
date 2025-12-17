/**
 * SchedulePrinter - модуль для генерації та друку розкладу занять
 * 
 * @example
 * const printer = new SchedulePrinter({ groupsPerPage: 4 });
 * printer.print(scheduleData);
 */
class SchedulePrinter {
    /**
     * @param {Object} config - Конфігурація принтера
     * @param {number} config.groupsPerPage - Кількість груп на сторінці (за замовчуванням 4)
     * @param {string[]} config.excludeDays - Дні для виключення з друку (за замовчуванням ['СУБОТА'])
     * @param {string[]} config.days - Всі дні тижня
     */
    constructor(config = {}) {
        this.config = {
            groupsPerPage: 4,
            excludeDays: ['СУБОТА'],
            days: ['ПОНЕДІЛОК', 'ВІВТОРОК', 'СЕРЕДА', 'ЧЕТВЕР', "П'ЯТНИЦЯ", 'СУБОТА'],
            ...config
        };
    }

    /**
     * Відкриває нове вікно з HTML для друку
     * @param {Object} scheduleData - Дані розкладу
     */
    print(scheduleData) {
        const printContent = this.generateHTML(scheduleData);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    /**
     * Генерує HTML сторінку для друку
     * @param {Object} scheduleData - Дані розкладу
     * @param {string} scheduleData.semester - Назва семестру
     * @param {string} scheduleData.directorName - ПІБ директора
     * @param {string[]} scheduleData.groups - Масив назв груп
     * @param {Object} scheduleData.schedule - Розклад {день: [{number, time, groups: {група: {subject, teacher}}}]}
     * @returns {string} HTML сторінка
     */
    generateHTML(scheduleData) {
        return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Розклад занять – ${scheduleData.semester}</title>
  <style>
${this._getStyles()}
  </style>
</head>
<body>
<button id="printBtn" onclick="window.print()">Друк</button>

<div id="wrapper">
  <div class="top-line">
    <div class="approve-block">
      ЗАТВЕРДЖУЮ<br>
      Директор коледжу<br>
      ${this._escapeHtml(scheduleData.directorName)}<span class="line"></span>
    </div>
  </div>

  <div class="title-block">
    <h1>РОЗКЛАД ЗАНЯТЬ</h1>
    <div>на ${this._escapeHtml(scheduleData.semester)}</div>
  </div>

  ${this._generateDayBlocks(scheduleData)}
</div>

</body>
</html>`;
    }

    /**
     * @private
     */
    _getStyles() {
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
     * @private
     */
    _generateDayBlocks(scheduleData) {
        const allGroups = scheduleData.groups;
        const { groupsPerPage, excludeDays, days } = this.config;
        let html = '';

        // Розбиваємо групи на чанки
        const groupChunks = [];
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
              ${groups.map(g => `<th>${this._escapeHtml(g)}</th>`).join('')}
            </tr>
            ${lessons.map((lesson, li) => `
              <tr>
                ${li === 0 ? `<td class="day-cell" rowspan="${lessons.length}">${day}</td>` : ''}
                <td>${lesson.number}</td>
                <td class="time-cell">${lesson.time}</td>
                ${groups.map(group => `
                  <td>
                    ${lesson.groups[group]?.subject ? `<div class="subject">${this._escapeHtml(lesson.groups[group].subject).replace(/\n/g, '<br>')}</div>` : ''}
                    ${lesson.groups[group]?.teacher ? `<div class="teacher">${this._escapeHtml(lesson.groups[group].teacher)}</div>` : ''}
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
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Експорт для використання як модуль
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SchedulePrinter };
}
