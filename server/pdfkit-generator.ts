import PDFDocument from 'pdfkit';
import { Lesson } from '@shared/schema';

// Transliteration map for Ukrainian/Russian to Latin
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
  'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ь': '', 'ю': 'yu', 'я': 'ya', 'ё': 'yo', 'ъ': '', 'ы': 'y', 'э': 'e',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'YE', 'Ж': 'ZH', 'З': 'Z',
  'И': 'Y', 'І': 'I', 'Ї': 'YI', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
  'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH',
  'Ь': '', 'Ю': 'YU', 'Я': 'YA', 'Ё': 'YO', 'Ъ': '', 'Ы': 'Y', 'Э': 'E', '\'': ''
};

function transliterateText(text: string): string {
  return text.split('').map(char => transliterationMap[char] || char).join('');
}

export function generateSchedulePDFKit(lessons: Lesson[], title: string = "Розклад занять"): Buffer {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      // Create a new PDF document in landscape mode with UTF-8 support
      const doc = new PDFDocument({ 
        size: 'A4',
        layout: 'landscape',
        margin: 20,
        info: {
          Title: 'Schedule',
          Subject: 'Weekly Schedule',
          Keywords: 'schedule, timetable'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title - use transliteration for compatibility
      const transliteratedTitle = transliterateText(title);
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(transliteratedTitle, { align: 'center' });
      
      doc.moveDown(1);

      // Get all unique groups and sort them
      const groups = [...new Set(lessons.map(l => l.group))].sort();
      
      // Days in Ukrainian with proper order
      const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const dayTranslations: Record<string, string> = {
        'Понедельник': 'MONDAY',
        'Вторник': 'TUESDAY', 
        'Среда': 'WEDNESDAY',
        'Четверг': 'THURSDAY',
        'Пятница': 'FRIDAY',
        'Суббота': 'SATURDAY'
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
           .text(dayTranslations[day] || transliterateText(day).toUpperCase(), 20);
        
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
           .text('TIME', currentX + 5, headerY + 8, { width: timeColWidth - 10, align: 'center' });

        currentX += timeColWidth;

        // Group headers
        groups.forEach((group) => {
          doc.rect(currentX, headerY, groupColWidth, 25)
             .stroke()
             .text(transliterateText(group), currentX + 5, headerY + 8, { width: groupColWidth - 10, align: 'center' });
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
              
              doc.text(transliterateText(lesson.subject), textX, rowY + 3, { width: textWidth, height: 10 });
              doc.text(transliterateText(lesson.teacher), textX, rowY + 13, { width: textWidth, height: 10 });
              doc.text(transliterateText(lesson.classroom), textX, rowY + 23, { width: textWidth, height: 10 });
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
  return generateSchedulePDFKit(lessons, "Tyzhnevyy rozklad zanyat");
}

export async function generateGroupSchedulePDFKit(lessons: Lesson[], group: string): Promise<Buffer> {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateSchedulePDFKit(groupLessons, `Rozklad zanyat dlya grupy ${transliterateText(group)}`);
}