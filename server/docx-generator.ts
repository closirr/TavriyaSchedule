import { Lesson } from '@shared/schema';

// Generate RTF document that can be opened in Word with proper Unicode support
export function generateScheduleRTF(lessons: Lesson[], title: string = "Розклад занять"): Buffer {
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

  // RTF document with proper UTF-8 encoding
  let rtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\landscape\\paperw16838\\paperh11906\\margl720\\margr720\\margt720\\margb720
\\f0\\fs20\\cf1
{\\pard\\qc\\b\\fs28 ${title}\\par}
\\par
`;

  dayOrder.forEach(day => {
    const dayLessons = lessons.filter(l => l.dayOfWeek === day);
    if (dayLessons.length === 0) return;

    rtf += `{\\pard\\b\\fs24 ${dayTranslations[day] || day}\\par}
\\par
`;
    
    const timeSlots = [...new Set(dayLessons.map(l => `${l.startTime}-${l.endTime}`))].sort();
    
    // Create table
    const numCols = groups.length + 1;
    rtf += `{\\pard\\trowd\\trgaph108\\trleft-108`;
    
    // Define column widths
    let cellx = 1440; // First column width (time)
    rtf += `\\cellx${cellx}`;
    
    const groupColWidth = Math.floor(9000 / groups.length);
    groups.forEach(() => {
      cellx += groupColWidth;
      rtf += `\\cellx${cellx}`;
    });
    
    // Header row
    rtf += `\\intbl\\b ЧАС\\cell`;
    groups.forEach(group => {
      rtf += `${group}\\cell`;
    });
    rtf += `\\row}
`;
    
    // Data rows
    timeSlots.forEach(timeSlot => {
      const timeLessons = dayLessons.filter(l => `${l.startTime}-${l.endTime}` === timeSlot);
      
      rtf += `{\\trowd\\trgaph108\\trleft-108`;
      cellx = 1440;
      rtf += `\\cellx${cellx}`;
      groups.forEach(() => {
        cellx += groupColWidth;
        rtf += `\\cellx${cellx}`;
      });
      
      rtf += `\\intbl ${timeSlot}\\cell`;
      groups.forEach(group => {
        const lesson = timeLessons.find(l => l.group === group);
        if (lesson) {
          rtf += `{\\b ${lesson.subject}}\\line ${lesson.teacher}\\line ${lesson.classroom}\\cell`;
        } else {
          rtf += `\\cell`;
        }
      });
      rtf += `\\row}
`;
    });
    
    rtf += `\\par
`;
  });

  rtf += `}`;
  
  return Buffer.from(rtf, 'utf8');
}

export function generateWeeklyScheduleRTF(lessons: Lesson[]): Buffer {
  return generateScheduleRTF(lessons, "Тижневий розклад занять");
}

export function generateGroupScheduleRTF(lessons: Lesson[], group: string): Buffer {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateScheduleRTF(groupLessons, `Розклад занять для групи ${group}`);
}