import { Lesson } from '@shared/schema';

// Use createRequire to handle jsPDF in ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jsPDFLib = require('jspdf');
const jsPDF = jsPDFLib.jsPDF || jsPDFLib.default || jsPDFLib;

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
  
  // Set fonts
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleY = 20;
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
    doc.setFont('helvetica', 'bold');
    doc.text(dayTranslations[day] || day.toUpperCase(), margin, currentY);
    currentY += 15;
    
    // Get time slots for this day
    const dayTimeSlots = [...new Set(dayLessons.map(l => `${l.startTime}-${l.endTime}`))].sort();
    
    // Calculate column widths
    const timeColWidth = 35;
    const groupColWidth = (pageWidth - margin * 2 - timeColWidth) / groups.length;
    
    // Draw table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Time header
    doc.rect(margin, currentY, timeColWidth, headerHeight);
    doc.text('Час', margin + timeColWidth/2, currentY + 7, { align: 'center' });
    
    // Group headers
    groups.forEach((group, index) => {
      const x = margin + timeColWidth + index * groupColWidth;
      doc.rect(x, currentY, groupColWidth, headerHeight);
      doc.text(group, x + groupColWidth/2, currentY + 7, { align: 'center' });
    });
    
    currentY += headerHeight;
    
    // Draw rows
    doc.setFont('helvetica', 'normal');
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
  return generateSchedulePDF(lessons, `Розклад занять для групи ${group}`);
}