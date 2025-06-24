import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Lesson } from '@shared/schema';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
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
  
  // Set fonts
  doc.setFont('helvetica');
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleY = 20;
  doc.text(title, doc.internal.pageSize.width / 2, titleY, { align: 'center' });
  
  // Get all unique groups and sort them
  const groups = [...new Set(lessons.map(l => l.group))].sort();
  
  // Get all unique time slots and sort them
  const timeSlots = [...new Set(lessons.map(l => `${l.startTime}-${l.endTime}`))].sort();
  
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
  
  // Organize lessons by day and time
  const scheduleByDay: Record<string, Record<string, Record<string, Lesson>>> = {};
  
  lessons.forEach(lesson => {
    const timeSlot = `${lesson.startTime}-${lesson.endTime}`;
    if (!scheduleByDay[lesson.dayOfWeek]) {
      scheduleByDay[lesson.dayOfWeek] = {};
    }
    if (!scheduleByDay[lesson.dayOfWeek][timeSlot]) {
      scheduleByDay[lesson.dayOfWeek][timeSlot] = {};
    }
    scheduleByDay[lesson.dayOfWeek][timeSlot][lesson.group] = lesson;
  });
  
  let currentY = titleY + 15;
  
  // Generate table for each day that has lessons
  dayOrder.forEach(day => {
    if (!scheduleByDay[day]) return;
    
    // Check if we need a new page
    if (currentY > 180) {
      doc.addPage();
      currentY = 20;
    }
    
    // Day header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(dayTranslations[day], 14, currentY);
    currentY += 10;
    
    // Create table data
    const tableData: any[][] = [];
    
    // Get time slots for this day
    const dayTimeSlots = Object.keys(scheduleByDay[day]).sort();
    
    dayTimeSlots.forEach((timeSlot, index) => {
      const row = [
        index === 0 ? dayTranslations[day] : '', // Day column only for first row
        (index + 1).toString(), // Lesson number
        timeSlot // Time
      ];
      
      // Add lesson data for each group
      groups.forEach(group => {
        const lesson = scheduleByDay[day][timeSlot][group];
        if (lesson) {
          const cellContent = `${lesson.subject}\n${lesson.teacher}\n${lesson.classroom}`;
          row.push(cellContent);
        } else {
          row.push('');
        }
      });
      
      tableData.push(row);
    });
    
    // Table headers
    const headers = ['Дні', '№', 'Час', ...groups];
    
    // Generate table
    doc.autoTable({
      startY: currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Day
        1: { cellWidth: 8, halign: 'center' },  // Number
        2: { cellWidth: 25, halign: 'center' }, // Time
      },
      didParseCell: function(data: any) {
        // Make group header cells bold
        if (data.row.index === -1 && data.column.index >= 3) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'center';
        }
        // Center align day and number columns
        if (data.column.index <= 2) {
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
        }
        // For lesson cells, use smaller font and top alignment
        if (data.column.index >= 3 && data.row.index >= 0) {
          data.cell.styles.fontSize = 7;
          data.cell.styles.valign = 'top';
          data.cell.styles.cellPadding = 1;
        }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  });
  
  // Add footer with generation date
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Згенеровано: ${new Date().toLocaleDateString('uk-UA')} | Сторінка ${i} з ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateWeeklySchedulePDF(lessons: Lesson[]): Buffer {
  return generateSchedulePDF(lessons, "Розклад занять на тиждень");
}

export function generateGroupSchedulePDF(lessons: Lesson[], groupName: string): Buffer {
  const groupLessons = lessons.filter(l => l.group === groupName);
  return generateSchedulePDF(groupLessons, `Розклад занять для групи ${groupName}`);
}