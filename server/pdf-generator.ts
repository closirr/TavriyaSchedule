import { Lesson } from '@shared/schema';

// Use createRequire to handle jsPDF in ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jsPDFLib = require('jspdf');
const jsPDF = jsPDFLib.jsPDF || jsPDFLib.default || jsPDFLib;

// Transliteration map for Ukrainian/Russian to Latin
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
  'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ь': '', 'ю': 'yu', 'я': 'ya', 'ё': 'yo', 'ъ': '', 'ы': 'y', 'э': 'e',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'YE', 'Ж': 'ZH', 'З': 'Z',
  'И': 'Y', 'І': 'I', 'Ї': 'YI', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
  'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH',
  'Ь': '', 'Ю': 'YU', 'Я': 'YA', 'Ё': 'YO', 'Ъ': '', 'Ы': 'Y', 'Э': 'E'
};

function transliterate(text: string): string {
  return text.split('').map(char => transliterationMap[char] || char).join('');
}

interface ScheduleDay {
  day: string;
  timeSlots: Array<{
    time: string;
    lessons: Record<string, {
      subject: string;
      teacher: string;
      classroom: string;
    }>;
  }>;
}

export function generateSchedulePDF(lessons: Lesson[], title: string = "Розклад занять"): Buffer {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  
  // Use courier font which has better character support
  doc.setFont('courier');
  
  // Title - use latin transliteration for better compatibility
  doc.setFontSize(16);
  doc.setFont('courier', 'bold');
  const titleY = 20;
  
  // Use original Ukrainian title
  doc.text(title, doc.internal.pageSize.width / 2, titleY, { align: 'center' });
  
  // Get all unique groups and sort them
  const groups = [...new Set(lessons.map(l => l.group))].sort();
  
  // Days in Ukrainian with proper order
  const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayTranslations: Record<string, string> = {
    'Понедельник': 'ПОНЕДІЛОК',
    'Вторник': 'ВІВТОРОК', 
    'Среда': 'СЕРЕДА',
    'Четверг': 'ЧЕТВЕР',
    'Пятница': 'П\'ЯТНИЦЯ',
    'Суббота': 'СУБОТА'
  };
  
  let currentY = titleY + 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const cellHeight = 12;
  const headerHeight = 10;
  
  // Generate schedule by days
  dayOrder.forEach((day) => {
    const dayLessons = lessons.filter(l => l.dayOfWeek === day);
    if (dayLessons.length === 0) return;
    
    // Check if we need a new page
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add day title
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    const dayText = dayTranslations[day] || day.toUpperCase();
    doc.text(dayText, margin, currentY);
    currentY += 15;
    
    // Get time slots for this day
    const dayTimeSlots = [...new Set(dayLessons.map(l => `${l.startTime}-${l.endTime}`))].sort();
    
    // Calculate column widths
    const timeColWidth = 35;
    const groupColWidth = (pageWidth - margin * 2 - timeColWidth) / groups.length;
    
    // Draw table headers
    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    
    // Time header
    doc.rect(margin, currentY, timeColWidth, headerHeight);
    doc.text('ЧАС', margin + timeColWidth/2, currentY + 7, { align: 'center' });
    
    // Group headers
    groups.forEach((group, index) => {
      const x = margin + timeColWidth + index * groupColWidth;
      doc.rect(x, currentY, groupColWidth, headerHeight);
      doc.text(group, x + groupColWidth/2, currentY + 7, { align: 'center' });
    });
    
    currentY += headerHeight;
    
    // Draw rows
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    
    dayTimeSlots.forEach((timeSlot) => {
      const timeLessons = dayLessons.filter(l => `${l.startTime}-${l.endTime}` === timeSlot);
      
      // Time column
      doc.rect(margin, currentY, timeColWidth, cellHeight);
      doc.text(timeSlot, margin + timeColWidth/2, currentY + 7, { align: 'center' });
      
      // Group columns
      groups.forEach((group, index) => {
        const x = margin + timeColWidth + index * groupColWidth;
        doc.rect(x, currentY, groupColWidth, cellHeight);
        
        const lesson = timeLessons.find(l => l.group === group);
        if (lesson) {
          const maxWidth = groupColWidth - 4;
          doc.text(lesson.subject, x + 2, currentY + 3, { maxWidth });
          doc.text(lesson.teacher, x + 2, currentY + 6, { maxWidth });
          doc.text(lesson.classroom, x + 2, currentY + 9, { maxWidth });
        }
      });
      
      currentY += cellHeight;
    });
    
    currentY += 10;
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateWeeklySchedulePDF(lessons: Lesson[]): Buffer {
  return generateSchedulePDF(lessons, "Тижневий розклад занять");
}

export function generateGroupSchedulePDF(lessons: Lesson[], group: string): Buffer {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateSchedulePDF(groupLessons, `Розклад занять для групи ${group}`);
}