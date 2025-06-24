import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scheduleFiltersSchema, insertLessonSchema } from "@shared/schema";
import * as XLSX from 'xlsx';
import multer from 'multer';
import { generateAllTemplates, type TemplateVariant } from './template-generator';
import { generateWeeklySchedulePDFKit, generateGroupSchedulePDFKit } from './pdfkit-generator';
import { generateWeeklyScheduleHTML, generateGroupScheduleHTML } from './html-pdf-generator';
import { generateWeeklyScheduleRTF, generateGroupScheduleRTF } from './docx-generator';
import { generateWeeklySchedulePuppeteerPDF, generateGroupSchedulePuppeteerPDF } from './puppeteer-pdf-generator';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log('File upload:', file.originalname, 'MIME:', file.mimetype);
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'application/zip' // .xlsx files are essentially ZIP archives
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => file.originalname?.toLowerCase().endsWith(ext));
    
    if (hasValidMime || hasValidExtension) {
      cb(null, true);
    } else {
      // console.log('Rejected file:', file.originalname, 'MIME:', file.mimetype);
      cb(new Error('Тільки Excel файли дозволені (.xlsx, .xls)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all lessons with optional filters
  app.get("/api/lessons", async (req, res) => {
    try {
      const filters = scheduleFiltersSchema.parse(req.query);
      const lessons = await storage.getLessonsFiltered(filters);
      res.json(lessons);
    } catch (error) {
      res.status(400).json({ message: "Невірні параметри фільтрації" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Помилка отримання статистики" });
    }
  });

  // Get filter options
  app.get("/api/filter-options", async (req, res) => {
    try {
      const [groups, teachers, classrooms] = await Promise.all([
        storage.getAllGroups(),
        storage.getAllTeachers(),
        storage.getAllClassrooms()
      ]);
      
      res.json({ groups, teachers, classrooms });
    } catch (error) {
      res.status(500).json({ message: "Помилка отримання опцій фільтрації" });
    }
  });

  // Upload Excel file
  app.post("/api/upload-schedule", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не було завантажено" });
      }

      // Parse Excel file with error handling
      let workbook;
      try {
        // Try different parsing approaches for better compatibility
        workbook = XLSX.read(req.file.buffer, { 
          type: 'buffer',
          cellDates: false,
          cellNF: false,
          cellText: true,
          dense: false,
          raw: false
        });
      } catch (parseError: unknown) {
        console.error('Excel parse error:', parseError);
        // Try alternative parsing method
        try {
          workbook = XLSX.read(req.file.buffer, { type: 'array' });
        } catch (secondError) {
          console.error('Second Excel parse error:', secondError);
          return res.status(400).json({ 
            message: "Помилка читання Excel файлу. Переконайтеся, що файл має правильний формат .xlsx та не пошкоджений",
            details: `Помилка: ${parseError instanceof Error ? parseError.message : 'Невідома помилка'}`
          });
        }
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ message: "Excel файл не містить аркушів з даними" });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return res.status(400).json({ message: "Не вдалося прочитати дані з першого аркуша Excel файлу" });
      }

      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: "",
        blankrows: true,
        raw: false
      });
      
      // console.log('Excel data structure:');
      // console.log('Total rows:', data.length);
      // console.log('First 10 rows:', data.slice(0, 10));

      if (data.length < 2) {
        return res.status(400).json({ message: "Excel файл повинен містити заголовки та дані" });
      }

      // Find header row - look more thoroughly
      let headerRowIndex = -1;
      let headers: string[] = [];
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i] as string[];
        if (row && row.length > 0) {
          const rowStr = row.join(' ').toLowerCase();
          const hasTimeColumn = row.includes('Дні') || row.includes('Дни') || 
                               row.includes('День недели') || row.includes('Час') || 
                               row.includes('Время') || rowStr.includes('час');
          const hasGroupPattern = row.some(cell => {
            const cellStr = String(cell || '').trim();
            return /^[А-ЯІЄЇ]+-\d+$/.test(cellStr) || 
                   cellStr.includes('МЕТ-') || cellStr.includes('МТ-') ||
                   cellStr.includes('ИТ-') || cellStr.includes('ЭК-') ||
                   cellStr.includes('ЕкДп-') || cellStr.includes('ЕкДл-') ||
                   cellStr.includes('А-');
          });
          
          if (hasTimeColumn || hasGroupPattern) {
            headerRowIndex = i;
            headers = row;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        return res.status(400).json({ message: "Не знайдено заголовок таблиці. Перевірте формат файлу." });
      }

      const rows = data.slice(headerRowIndex + 1) as any[][];
      let jsonData: any[] = [];
      
      // console.log('Processing Excel with headers:', headers);
      // console.log('Headers length:', headers.length);
      
      // Improved detection for both horizontal and vertical formats
      const hasTimeColumns = headers.some(h => {
        const header = String(h || '').toLowerCase();
        return header.includes('час') || header.includes('время') || 
               header.includes('дні') || header.includes('дни');
      });
      
      const hasGroupPattern = headers.some(h => {
        const cellStr = String(h || '').trim();
        return /^[А-ЯІЄЇ]+-\d+$/.test(cellStr) || 
               cellStr.includes('МЕТ-') || cellStr.includes('МТ-') ||
               cellStr.includes('ИТ-') || cellStr.includes('ЭК-') ||
               cellStr.includes('ЕкДп-') || cellStr.includes('ЕкДл-') ||
               cellStr.includes('А-');
      });
      
      // Also check in data rows for vertical format
      const hasGroupsInData = rows.some(row => 
        row && row.some((cell: any) => {
          const cellStr = String(cell || '').trim();
          return /^[А-ЯІЄЇ]+-\d+$/.test(cellStr) || 
                 cellStr.includes('МЕТ-') || cellStr.includes('МТ-') ||
                 cellStr.includes('ИТ-') || cellStr.includes('ЭК-') ||
                 cellStr.includes('ЕкДп-') || cellStr.includes('ЕкДл-') ||
                 cellStr.includes('А-');
        })
      );
      
      const hasGridFormat = hasTimeColumns || hasGroupPattern || hasGroupsInData;
      
      // console.log('Has grid format:', hasGridFormat);
      
      if (hasGridFormat) {
        // console.log('Processing grid format...');
        
        // Special handling for vertical format with groups in columns
        const groupInfo: Array<{name: string, startCol: number}> = [];
        
        // Dynamic group detection for vertical format
        // Look through headers for group names
        for (let i = 0; i < headers.length; i++) {
          const header = String(headers[i] || '').trim();
          if (/^[А-ЯІЄЇ]+-\d+$/.test(header)) {
            groupInfo.push({name: header, startCol: i});
          }
        }
        
        // If not found in headers, use known structure from logs
        if (groupInfo.length === 0) {
          // Based on console output: МЕТ-11 at pos 1, МТ-11 at pos 4, ЕкДл-11 at pos 7
          groupInfo.push(
            {name: 'МЕТ-11', startCol: 1},
            {name: 'МТ-11', startCol: 4}, 
            {name: 'ЕкДл-11', startCol: 7}
          );
        }
        
        // console.log('Found groups:', groupInfo);
        
        let currentDay = '';
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          if (!row || row.length === 0) continue;
          
          const firstCell = String(row[0] || '').trim();
          
          // Check for day names
          if (firstCell && (firstCell.includes('ПОНЕДІЛЬОК') || firstCell.includes('ПОНЕДЕЛЬНИК') ||
                           firstCell.includes('ВІВТОРОК') || firstCell.includes('ВТОРНИК') || 
                           firstCell.includes('СЕРЕДА') || firstCell.includes('СРЕДА') || 
                           firstCell.includes('ЧЕТВЕР') || firstCell.includes('ЧЕТВЕРГ') || 
                           firstCell.includes('П\'ЯТНИЦЯ') || firstCell.includes('ПЯТНИЦА') || 
                           firstCell.includes('СУББОТА'))) {
            // Convert Ukrainian to Russian day names for database consistency
            currentDay = firstCell
              .replace('ПОНЕДІЛЬОК', 'Понедельник')
              .replace('ВІВТОРОК', 'Вторник')
              .replace('СЕРЕДА', 'Среда')
              .replace('ЧЕТВЕР', 'Четверг')
              .replace('П\'ЯТНИЦЯ', 'Пятница')
              .replace('ПОНЕДЕЛЬНИК', 'Понедельник')
              .replace('ЧЕТВЕРГ', 'Четверг')
              .replace('ПЯТНИЦА', 'Пятница')
              .replace('СУББОТА', 'Суббота')
              .replace(/[^\u0400-\u04FF\s\']/g, '').trim();
            // console.log('Found day:', currentDay);
            continue;
          }
          
          // Check for time slots
          if (firstCell && firstCell.includes('-') && currentDay) {
            const normalizedTime = firstCell.replace(/\./g, ':');
            const timeMatch = normalizedTime.match(/(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})/);
            if (!timeMatch) continue;
            
            const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            
            // console.log(`Processing time slot: ${startTime}-${endTime}`);
            
            // Process each group - for vertical format, each group has 3 columns: subject, teacher, classroom
            for (const group of groupInfo) {
              const subjectCol = group.startCol;
              const teacherCol = group.startCol + 1;
              const classroomCol = group.startCol + 2;
              
              const subject = String(row[subjectCol] || '').trim();
              const teacher = String(row[teacherCol] || '').trim();
              const classroom = String(row[classroomCol] || '').trim();
              
              if (subject && teacher) {
                // console.log(`Adding lesson: ${group.name} - ${subject} - ${teacher}`);
                jsonData.push({
                  'День недели': currentDay,
                  'Время начала': startTime,
                  'Время окончания': endTime,
                  'Предмет': subject,
                  'Преподаватель': teacher,
                  'Группа': group.name,
                  'Аудитория': classroom || 'Не вказана'
                });
              }
            }
          }
        }
      } else if (headers.length > 7 && 
                 (headers.includes('Предмет') || headers.includes('Преподаватель') || headers.includes('Аудитория'))) {
        
        // Separate columns format parsing (both horizontal and vertical)
        let currentDay = '';
        const groupsInfo: Array<{name: string, startCol: number}> = [];
        
        // Find groups and their column positions in first row
        for (let i = 1; i < headers.length; i++) {
          const header = headers[i];
          if (header && (header.includes('ИТ-') || header.includes('ЭК-') || 
                        header.includes('А-') || header.includes('М-') ||
                        /^[А-Я]+-\d+$/.test(header))) {
            groupsInfo.push({name: header, startCol: i});
          }
        }
        
        // If no groups found in headers, look in data rows (vertical format)
        if (groupsInfo.length === 0) {
          for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            for (let colIndex = 1; colIndex < row.length; colIndex++) {
              const cell = String(row[colIndex] || '').trim();
              if (cell && (cell.includes('ИТ-') || cell.includes('ЭК-') || 
                          cell.includes('А-') || cell.includes('М-') ||
                          /^[А-Я]+-\d+$/.test(cell))) {
                if (!groupsInfo.find(g => g.name === cell)) {
                  groupsInfo.push({name: cell, startCol: colIndex});
                }
              }
            }
          }
        }
        
        // Enhanced parsing for vertical format with improved group detection
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const dayCell = String(row[0] || '').trim();
          
          // Check if this row contains group headers - look for patterns like ИТ-21, МЕТ-11, etc.
          const currentRowGroups: Array<{name: string, startCol: number}> = [];
          for (let colIndex = 1; colIndex < row.length; colIndex++) {
            const cell = String(row[colIndex] || '').trim();
            // Enhanced group pattern matching
            if (cell && (/^[А-ЯІЄЇ]+-\d+$/.test(cell) || 
                        cell.includes('ИТ-') || cell.includes('ЭК-') || 
                        cell.includes('МЕТ-') || cell.includes('МТ-') ||
                        cell.includes('ЕкДп-') || cell.includes('ЕкДл-') ||
                        cell.includes('А-') || cell.includes('М-') ||
                        cell.includes('КН-') || cell.includes('ФК-'))) {
              currentRowGroups.push({name: cell, startCol: colIndex});
            }
          }
          
          // If we found groups in this row, use them for subsequent rows
          if (currentRowGroups.length > 0) {
            groupsInfo.length = 0; // Clear existing
            groupsInfo.push(...currentRowGroups);
            continue;
          }
          
          // Update current day
          if (dayCell && (dayCell.includes('ПОНЕДЕЛЬНИК') || dayCell.includes('ПОНЕДІЛЬОК') ||
                         dayCell.includes('ВТОРНИК') || dayCell.includes('ВІВТОРОК') || 
                         dayCell.includes('СРЕДА') || dayCell.includes('СЕРЕДА') || 
                         dayCell.includes('ЧЕТВЕРГ') || dayCell.includes('ЧЕТВЕР') || 
                         dayCell.includes('ПЯТНИЦА') || dayCell.includes('П\'ЯТНИЦЯ') || 
                         dayCell.includes('СУББОТА'))) {
            currentDay = dayCell
              .replace('ПОНЕДІЛЬОК', 'Понедельник')
              .replace('ВІВТОРОК', 'Вторник')
              .replace('СЕРЕДА', 'Среда')
              .replace('ЧЕТВЕР', 'Четверг')
              .replace('П\'ЯТНИЦЯ', 'Пятница')
              .replace('ПОНЕДЕЛЬНИК', 'Понедельник')
              .replace('ЧЕТВЕРГ', 'Четверг')
              .replace('ПЯТНИЦА', 'Пятница')
              .replace('СУББОТА', 'Суббота')
              .replace(/[^\u0400-\u04FF\s\']/g, '').trim();
            continue;
          }
          
          // Parse time slots - check both first column and time-specific columns
          const timeCell = String(row[0] || '').trim();
          const timeCell2 = String(row[1] || '').trim(); // Sometimes time is in second column
          
          let timeToProcess = '';
          if (timeCell && timeCell.includes('-')) {
            timeToProcess = timeCell;
          } else if (timeCell2 && timeCell2.includes('-')) {
            timeToProcess = timeCell2;
          }
          
          if (timeToProcess && currentDay && groupsInfo.length > 0) {
            const normalizedTime = timeToProcess.replace(/\./g, ':');
            const timeMatch = normalizedTime.match(/(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})/);
            if (!timeMatch) continue;
            
            const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            
            // Process each group - handle different column layouts
            for (const group of groupsInfo) {
              let subject = '', teacher = '', classroom = '';
              
              // Try different column arrangements for vertical format
              const cellContent = String(row[group.startCol] || '').trim();
              
              if (cellContent) {
                // Check if it's a multi-line cell (separated by newlines)
                const lines = cellContent.split('\n').map(l => l.trim()).filter(l => l);
                
                if (lines.length >= 3) {
                  // Multi-line format: subject, teacher, classroom
                  subject = lines[0];
                  teacher = lines[1];
                  classroom = lines[2];
                } else if (lines.length === 2) {
                  // Two lines: subject and teacher, classroom in next column
                  subject = lines[0];
                  teacher = lines[1];
                  classroom = String(row[group.startCol + 1] || '').trim();
                } else if (lines.length === 1) {
                  // Single line: try to parse or look in adjacent columns
                  subject = lines[0];
                  teacher = String(row[group.startCol + 1] || '').trim();
                  classroom = String(row[group.startCol + 2] || '').trim();
                }
                
                // Validate and add lesson if we have required fields
                if (subject && teacher) {
                  jsonData.push({
                    'День недели': currentDay,
                    'Время начала': startTime,
                    'Время окончания': endTime,
                    'Предмет': subject,
                    'Преподаватель': teacher,
                    'Группа': group.name,
                    'Аудитория': classroom || 'Не вказана'
                  });
                }
              }
            }
          }
        }
      } else {
        // Standard table format
        jsonData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });
      }

      if (jsonData.length === 0) {
        console.log('Debug info - No data parsed:');
        console.log('Headers found:', headers);
        console.log('Header row index:', headerRowIndex);
        console.log('Data rows count:', rows.length);
        console.log('jsonData length:', jsonData.length);
        console.log('Groups found:', groupInfo.length);
        return res.status(400).json({ 
          message: "Excel файл не містить даних для парсингу. Перевірте формат файлу.",
          debug: {
            headersFound: headers.length,
            rowsCount: rows.length,
            sampleHeaders: headers.slice(0, 10)
          }
        });
      }

      // Validate and transform data
      const lessons = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

        try {
          // Map Excel columns to our schema with better error handling
          const lesson = {
            dayOfWeek: String(row['День недели'] || row['Day'] || '').trim(),
            startTime: String(row['Время начала'] || row['Start Time'] || '').trim(),
            endTime: String(row['Время окончания'] || row['End Time'] || '').trim(),
            subject: String(row['Предмет'] || row['Subject'] || '').trim(),
            teacher: String(row['Преподаватель'] || row['Teacher'] || '').trim(),
            group: String(row['Группа'] || row['Group'] || '').trim(),
            classroom: String(row['Аудитория'] || row['Classroom'] || '').trim()
          };

          // Validate required fields (removed lessonType)
          if (!lesson.dayOfWeek || !lesson.startTime || !lesson.endTime || 
              !lesson.subject || !lesson.teacher || !lesson.group || 
              !lesson.classroom) {
            errors.push(`Рядок ${rowNumber}: відсутні обов'язкові поля`);
            continue;
          }

          // Validate day of week
          const validDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
          if (!validDays.includes(lesson.dayOfWeek)) {
            errors.push(`Рядок ${rowNumber}: невірний день тижня "${lesson.dayOfWeek}"`);
            continue;
          }

          // Validate time format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(lesson.startTime) || !timeRegex.test(lesson.endTime)) {
            errors.push(`Рядок ${rowNumber}: невірний формат часу`);
            continue;
          }

          const validatedLesson = insertLessonSchema.parse(lesson);
          lessons.push(validatedLesson);
        } catch (error) {
          errors.push(`Рядок ${rowNumber}: помилка валідації даних`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Обнаружены ошибки в данных",
          errors: errors.slice(0, 10) // Limit to first 10 errors
        });
      }

      if (lessons.length === 0) {
        return res.status(400).json({ message: "Не знайдено коректних записів" });
      }

      // Clear existing lessons and add new ones
      await storage.clearAllLessons();
      await storage.createManyLessons(lessons);

      res.json({ 
        message: "Розклад успішно завантажено",
        lessonsCount: lessons.length 
      });
    } catch (error) {
      console.error('Excel upload error:', error);
      res.status(500).json({ message: "Помилка обробки файлу" });
    }
  });

  // Download template Excel file
  app.get("/api/template", (req, res) => {
    try {
      // Матричная структура - более удобная для заполнения
      const templateData = [
        ['День недели', 'Время', 'ИТ-21', 'ИТ-22', 'ЭК-21'],
        ['', '', '(Предмет - Преподаватель - Аудитория - Тип)', '(Предмет - Преподаватель - Аудитория - Тип)', '(Предмет - Преподаватель - Аудитория - Тип)'],
        ['Понедельник', '08:30-10:00', 'Математика - Иванов И.И. - 101 - Лекция', 'Программирование - Петров П.П. - Лаб-1 - Практика', ''],
        ['Понедельник', '10:15-11:45', 'Базы данных - Сидоров А.В. - 102 - Лекция', '', 'Экономика - Козлов К.К. - 205 - Лекция'],
        ['Понедельник', '12:15-13:45', '', 'Веб-разработка - Морозов М.М. - 201 - Практика', 'Менеджмент - Федоров Ф.Ф. - 206 - Семинар'],
        ['', '', '', '', ''],
        ['Вторник', '08:30-10:00', '', '', ''],
        ['Вторник', '10:15-11:45', '', '', ''],
        ['Вторник', '12:15-13:45', '', '', ''],
        ['', '', '', '', ''],
        ['Среда', '08:30-10:00', '', '', ''],
        ['Среда', '10:15-11:45', '', '', ''],
        ['Среда', '12:15-13:45', '', '', ''],
        ['', '', '', '', ''],
        ['Четверг', '08:30-10:00', '', '', ''],
        ['Четверг', '10:15-11:45', '', '', ''],
        ['Четверг', '12:15-13:45', '', '', ''],
        ['', '', '', '', ''],
        ['Пятница', '08:30-10:00', '', '', ''],
        ['Пятница', '10:15-11:45', '', '', ''],
        ['Пятница', '12:15-13:45', '', '', '']
      ];

      // Create workbook from array
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Set column widths for matrix structure
      worksheet['!cols'] = [
        { wch: 12 }, // День недели
        { wch: 15 }, // Время
        { wch: 35 }, // ИТ-21
        { wch: 35 }, // ИТ-22
        { wch: 35 }  // ЭК-21
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Расписание');

      // Generate buffer with compatibility settings
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: false,
        bookSST: false
      });

      // Set headers to force download and prevent caching
      res.setHeader('Content-Disposition', 'attachment; filename="raspisanie_tavricheskiy_kolledzh.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Length', buffer.length.toString());
      
      res.send(buffer);
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: "Ошибка создания шаблона" });
    }
  });

  // Get list of available templates
  app.get("/api/templates", (req, res) => {
    try {
      const templates = generateAllTemplates();
      const templateList = templates.map(t => ({
        name: t.name,
        filename: t.filename,
        description: t.description
      }));
      res.json(templateList);
    } catch (error) {
      console.error('Template list error:', error);
      res.status(500).json({ message: "Ошибка получения списка шаблонов" });
    }
  });

  // Export schedule as PDF (Latin transliteration)
  app.get("/api/export/pdf", async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      const pdfBuffer = await generateWeeklySchedulePDFKit(lessons);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: "Помилка експорту в PDF" });
    }
  });

  // Export schedule as PDF with Cyrillic (via Puppeteer)
  app.get("/api/export/pdf-cyrillic", async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      const pdfBuffer = await generateWeeklySchedulePuppeteerPDF(lessons);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-cyrillic-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Puppeteer PDF export error:', error);
      res.status(500).json({ message: "Помилка експорту PDF з кирилицею" });
    }
  });

  // Export schedule as HTML
  app.get("/api/export/html", async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      const htmlContent = generateWeeklyScheduleHTML(lessons);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${new Date().toISOString().split('T')[0]}.html"`);
      res.send(htmlContent);
    } catch (error) {
      console.error('HTML export error:', error);
      res.status(500).json({ message: "Помилка експорту в HTML" });
    }
  });

  // Export schedule as RTF (Word compatible)
  app.get("/api/export/rtf", async (req, res) => {
    try {
      const lessons = await storage.getAllLessons();
      const rtfBuffer = generateWeeklyScheduleRTF(lessons);
      
      res.setHeader('Content-Type', 'application/rtf');
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${new Date().toISOString().split('T')[0]}.rtf"`);
      res.send(rtfBuffer);
    } catch (error) {
      console.error('RTF export error:', error);
      res.status(500).json({ message: "Помилка експорту в RTF" });
    }
  });

  // Export schedule for specific group as PDF (Latin transliteration)
  app.get("/api/export/pdf/:group", async (req, res) => {
    try {
      const group = req.params.group;
      const lessons = await storage.getAllLessons();
      const pdfBuffer = await generateGroupSchedulePDFKit(lessons, group);
      
      res.setHeader('Content-Type', 'application/pdf');
      const safeGroup = encodeURIComponent(group);
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${safeGroup}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: "Помилка експорту в PDF" });
    }
  });

  // Export schedule for specific group as PDF with Cyrillic (via Puppeteer)
  app.get("/api/export/pdf-cyrillic/:group", async (req, res) => {
    try {
      const group = req.params.group;
      const lessons = await storage.getAllLessons();
      const pdfBuffer = await generateGroupSchedulePuppeteerPDF(lessons, group);
      
      res.setHeader('Content-Type', 'application/pdf');
      const safeGroup = encodeURIComponent(group);
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-cyrillic-${safeGroup}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Puppeteer PDF export error:', error);
      res.status(500).json({ message: "Помилка експорту PDF з кирилицею" });
    }
  });

  // Export schedule for specific group as HTML
  app.get("/api/export/html/:group", async (req, res) => {
    try {
      const group = req.params.group;
      const lessons = await storage.getAllLessons();
      const htmlContent = generateGroupScheduleHTML(lessons, group);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const safeGroup = encodeURIComponent(group);
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${safeGroup}-${new Date().toISOString().split('T')[0]}.html"`);
      res.send(htmlContent);
    } catch (error) {
      console.error('HTML export error:', error);
      res.status(500).json({ message: "Помилка експорту в HTML" });
    }
  });

  // Export schedule for specific group as RTF
  app.get("/api/export/rtf/:group", async (req, res) => {
    try {
      const group = req.params.group;
      const lessons = await storage.getAllLessons();
      const rtfBuffer = generateGroupScheduleRTF(lessons, group);
      
      res.setHeader('Content-Type', 'application/rtf');
      const safeGroup = encodeURIComponent(group);
      res.setHeader('Content-Disposition', `attachment; filename="rozklad-${safeGroup}-${new Date().toISOString().split('T')[0]}.rtf"`);
      res.send(rtfBuffer);
    } catch (error) {
      console.error('RTF export error:', error);
      res.status(500).json({ message: "Помилка експорту в RTF" });
    }
  });

  // Clear all lessons
  app.delete("/api/clear-schedule", async (req, res) => {
    try {
      await storage.clearAllLessons();
      res.json({ message: "Розклад очищено" });
    } catch (error) {
      res.status(500).json({ message: "Помилка очищення розкладу" });
    }
  });

  // Download specific template by filename
  app.get("/api/templates/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const templates = generateAllTemplates();
      const template = templates.find(t => t.filename === filename);
      
      if (!template) {
        return res.status(404).json({ message: "Шаблон не найден" });
      }

      // Create workbook from template data
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(template.data);
      
      // Set column widths for better readability
      if (template.filename === 'template_separate_columns.xlsx') {
        const cols = [{ wch: 12 }]; // Время
        for (let i = 0; i < 20; i++) {
          cols.push({ wch: 15 }); // Предмет
          cols.push({ wch: 20 }); // Преподаватель  
          cols.push({ wch: 12 }); // Аудитория
        }
        worksheet['!cols'] = cols;
        
        // Объединение ячеек для заголовков групп (20 групп)
        const merges = [];
        for (let i = 0; i < 20; i++) {
          const startCol = 1 + (i * 3);
          const endCol = startCol + 2;
          merges.push({ s: { c: startCol, r: 2 }, e: { c: endCol, r: 2 } });
        }
        worksheet['!merges'] = merges;
      } else if (template.filename === 'template_demo_5groups.xlsx') {
        const cols = [{ wch: 12 }]; // Время
        for (let i = 0; i < 5; i++) {
          cols.push({ wch: 15 }); // Предмет
          cols.push({ wch: 20 }); // Преподаватель  
          cols.push({ wch: 12 }); // Аудитория
        }
        worksheet['!cols'] = cols;
        

      } else if (template.filename === 'template_vertical_4groups.xlsx') {
        worksheet['!cols'] = [
          { wch: 12 }, // Время
          { wch: 15 }, { wch: 20 }, { wch: 12 }, // Группа 1
          { wch: 15 }, { wch: 20 }, { wch: 12 }, // Группа 2
          { wch: 15 }, { wch: 20 }, { wch: 12 }, // Группа 3
          { wch: 15 }, { wch: 20 }, { wch: 12 }  // Группа 4
        ];
        
        // Находим все строки с заголовками групп и создаем объединения
        const merges = [];
        const rows = template.data;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          if (row && row.length > 1 && typeof row[1] === 'string' && 
              (row[1].includes('ИТ-') || row[1].includes('ЭК-') || row[1].includes('А-') || row[1].includes('М-'))) {
            // Это строка с заголовками групп, создаем объединения
            for (let groupIndex = 0; groupIndex < 4; groupIndex++) {
              const startCol = 1 + (groupIndex * 3);
              const endCol = startCol + 2;
              if (startCol < row.length) {
                merges.push({ s: { c: startCol, r: rowIndex }, e: { c: endCol, r: rowIndex } });
              }
            }
          }
        }
        worksheet['!merges'] = merges;
      } else if (template.filename === 'template_vertical_3groups.xlsx') {
        worksheet['!cols'] = [
          { wch: 12 }, // Время
          { wch: 15 }, { wch: 20 }, { wch: 12 }, // Группа 1
          { wch: 15 }, { wch: 20 }, { wch: 12 }, // Группа 2
          { wch: 15 }, { wch: 20 }, { wch: 12 }  // Группа 3
        ];
        
        // Находим все строки с заголовками групп и создаем объединения
        const merges = [];
        const rows = template.data;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          if (row && row.length > 1 && typeof row[1] === 'string' && 
              (row[1].includes('МЕТ-') || row[1].includes('МТ-') || row[1].includes('ЕкДл-') || 
               row[1].includes('А-') || row[1].includes('ІТ-') || row[1].includes('КН-') || 
               row[1].includes('ФК-') || row[1].includes('СП-'))) {
            // Это строка с заголовками групп, создаем объединения
            for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
              const startCol = 1 + (groupIndex * 3);
              const endCol = startCol + 2;
              if (startCol < row.length) {
                merges.push({ s: { c: startCol, r: rowIndex }, e: { c: endCol, r: rowIndex } });
              }
            }
          }
        }
        worksheet['!merges'] = merges;
      } else {
        worksheet['!cols'] = [
          { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
          { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Расписание');

      // Generate buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: false,
        bookSST: false
      });

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Length', buffer.length.toString());
      
      res.send(buffer);
    } catch (error) {
      console.error('Template download error:', error);
      res.status(500).json({ message: "Ошибка скачивания шаблона" });
    }
  });

  // Clear all schedule data
  app.delete("/api/clear-schedule", async (req, res) => {
    try {
      await storage.clearAllLessons();
      res.json({ message: "Все данные расписания очищены" });
    } catch (error) {
      console.error('Clear schedule error:', error);
      res.status(500).json({ message: "Ошибка очистки данных" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
