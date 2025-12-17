import { Lesson } from '@shared/schema';

// Generate HTML that can be converted to PDF with proper Unicode support
export function generateScheduleHTML(lessons: Lesson[], title: string = "Розклад занять"): string {
  const groups = [...new Set(lessons.map(l => l.group))].sort();
  
  const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayTranslations: Record<string, string> = {
    'Понедельник': 'ПОНЕДІЛОК',
    'Вторник': 'ВІВТОРОК', 
    'Среда': 'СЕРЕДА',
    'Четверг': 'ЧЕТВЕР',
    'Пятница': 'П\'ЯТНИЦЯ',
    'Суббота': 'СУБОТА'
  };

  let html = `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page { 
            size: A4 landscape; 
            margin: 10mm; 
        }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 8px; 
            margin: 0; 
            padding: 0;
            background: white;
        }
        .title { 
            text-align: center; 
            font-size: 14px; 
            font-weight: bold; 
            margin-bottom: 15px; 
        }
        .day-title { 
            font-size: 10px; 
            font-weight: bold; 
            margin: 10px 0 5px 0; 
            background: #f0f0f0; 
            padding: 3px; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px; 
            page-break-inside: avoid; 
        }
        th, td { 
            border: 1px solid #000; 
            padding: 2px; 
            text-align: center; 
            vertical-align: top; 
            font-size: 7px; 
        }
        th { 
            background: #f0f0f0; 
            font-weight: bold; 
        }
        .time-col { 
            width: 60px; 
        }
        .lesson-cell { 
            height: 35px; 
            font-size: 6px; 
            line-height: 1.1; 
        }
        .subject { 
            font-weight: bold; 
        }
        .teacher { 
            font-style: italic; 
        }
        .classroom { 
            text-decoration: underline; 
        }
    </style>
</head>
<body>
    <div class="title">${title}</div>
`;

  dayOrder.forEach(day => {
    const dayLessons = lessons.filter(l => l.dayOfWeek === day);
    if (dayLessons.length === 0) return;

    html += `<div class="day-title">${dayTranslations[day] || day}</div>`;
    
    const timeSlots = [...new Set(dayLessons.map(l => `${l.startTime}-${l.endTime}`))].sort();
    
    html += `<table>`;
    
    // Header row
    html += `<tr><th class="time-col">ЧАС</th>`;
    groups.forEach(group => {
      html += `<th>${group}</th>`;
    });
    html += `</tr>`;
    
    // Data rows
    timeSlots.forEach(timeSlot => {
      const timeLessons = dayLessons.filter(l => `${l.startTime}-${l.endTime}` === timeSlot);
      
      html += `<tr><td class="time-col">${timeSlot}</td>`;
      groups.forEach(group => {
        const lesson = timeLessons.find(l => l.group === group);
        if (lesson) {
          html += `<td class="lesson-cell">
            <div class="subject">${lesson.subject}</div>
            <div class="teacher">${lesson.teacher}</div>
            <div class="classroom">${lesson.classroom}</div>
          </td>`;
        } else {
          html += `<td class="lesson-cell"></td>`;
        }
      });
      html += `</tr>`;
    });
    
    html += `</table>`;
  });

  html += `</body></html>`;
  return html;
}

export function generateWeeklyScheduleHTML(lessons: Lesson[]): string {
  return generateScheduleHTML(lessons, "Тижневий розклад занять");
}

export function generateGroupScheduleHTML(lessons: Lesson[], group: string): string {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateScheduleHTML(groupLessons, `Розклад занять для групи ${group}`);
}