import PDFDocument from 'pdfkit';
import { Lesson } from '@shared/schema';

export function generateSchedulePDFKit(lessons: Lesson[], title: string = "Розклад занять"): Buffer {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      // Create a new PDF document in landscape mode
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'landscape',
        margin: 20
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });
      
      doc.moveDown(1);

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

      const pageWidth = doc.page.width - 40; // Account for margins
      const timeColWidth = 80;
      const groupColWidth = (pageWidth - timeColWidth) / groups.length;

      // Generate schedule by days
      dayOrder.forEach((day) => {
        const dayLessons = lessons.filter(l => l.dayOfWeek === day);
        if (dayLessons.length === 0) return;

        // Check if we need a new page
        if (doc.y > 500) {
          doc.addPage();
        }

        // Add day title
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(dayTranslations[day] || day.toUpperCase(), 20);
        
        doc.moveDown(0.5);

        // Get time slots for this day
        const dayTimeSlots = [...new Set(dayLessons.map(l => `${l.startTime}-${l.endTime}`))].sort();

        // Draw table headers
        let currentX = 20;
        const headerY = doc.y;
        
        doc.fontSize(9)
           .font('Helvetica-Bold');

        // Time header
        doc.rect(currentX, headerY, timeColWidth, 25)
           .stroke()
           .text('ЧАС', currentX + 5, headerY + 8, { width: timeColWidth - 10, align: 'center' });

        currentX += timeColWidth;

        // Group headers
        groups.forEach((group) => {
          doc.rect(currentX, headerY, groupColWidth, 25)
             .stroke()
             .text(group, currentX + 5, headerY + 8, { width: groupColWidth - 10, align: 'center' });
          currentX += groupColWidth;
        });

        // Move to next row
        doc.y = headerY + 25;

        // Draw data rows
        doc.fontSize(7)
           .font('Helvetica');

        dayTimeSlots.forEach((timeSlot) => {
          const timeLessons = dayLessons.filter(l => `${l.startTime}-${l.endTime}` === timeSlot);
          const rowY = doc.y;
          const rowHeight = 35;

          currentX = 20;

          // Time column
          doc.rect(currentX, rowY, timeColWidth, rowHeight)
             .stroke()
             .text(timeSlot, currentX + 5, rowY + 15, { width: timeColWidth - 10, align: 'center' });

          currentX += timeColWidth;

          // Group columns
          groups.forEach((group) => {
            doc.rect(currentX, rowY, groupColWidth, rowHeight)
               .stroke();

            const lesson = timeLessons.find(l => l.group === group);
            if (lesson) {
              const textX = currentX + 3;
              const textWidth = groupColWidth - 6;
              
              doc.text(lesson.subject, textX, rowY + 3, { width: textWidth, height: 10 });
              doc.text(lesson.teacher, textX, rowY + 13, { width: textWidth, height: 10 });
              doc.text(lesson.classroom, textX, rowY + 23, { width: textWidth, height: 10 });
            }

            currentX += groupColWidth;
          });

          doc.y = rowY + rowHeight;
        });

        doc.moveDown(1);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  }) as any;
}

export async function generateWeeklySchedulePDFKit(lessons: Lesson[]): Promise<Buffer> {
  return generateSchedulePDFKit(lessons, "Тижневий розклад занять");
}

export async function generateGroupSchedulePDFKit(lessons: Lesson[], group: string): Promise<Buffer> {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateSchedulePDFKit(groupLessons, `Розклад занять для групи ${group}`);
}