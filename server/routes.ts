import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scheduleFiltersSchema, insertLessonSchema } from "@shared/schema";
import * as XLSX from 'xlsx';
import multer from 'multer';
import { generateAllTemplates, type TemplateVariant } from './template-generator';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Только Excel файлы разрешены (.xlsx, .xls)'));
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
      res.status(400).json({ message: "Неверные параметры фильтрации" });
    }
  });

  // Get statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения статистики" });
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
      res.status(500).json({ message: "Ошибка получения опций фильтрации" });
    }
  });

  // Upload Excel file
  app.post("/api/upload-schedule", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
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
            message: "Ошибка чтения Excel файла. Убедитесь, что файл имеет правильный формат .xlsx и не поврежден",
            details: `Ошибка: ${parseError instanceof Error ? parseError.message : 'Неизвестная ошибка'}`
          });
        }
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ message: "Excel файл не содержит листов с данными" });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return res.status(400).json({ message: "Не удалось прочитать данные из первого листа Excel файла" });
      }

      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: "",
        blankrows: false
      });

      if (data.length < 3) {
        return res.status(400).json({ message: "Excel файл должен содержать заголовки и данные" });
      }

      // Find header row (usually row 2 or 3)
      let headerRowIndex = -1;
      let headers: string[] = [];
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i] as string[];
        if (row.includes('Дні') || row.includes('Дни') || row.includes('День недели') || 
            row.includes('МЕТ-11') || row.includes('ИТ-21') || row.includes('ЕкДп-11')) {
          headerRowIndex = i;
          headers = row;
          break;
        }
      }

      if (headerRowIndex === -1) {
        return res.status(400).json({ message: "Не найден заголовок таблицы. Проверьте формат файла." });
      }

      const rows = data.slice(headerRowIndex + 1) as any[][];
      let jsonData: any[] = [];
      
      // Check for grid format (Ukrainian/Russian schedule format)
      if (headers.length >= 4 && 
          (headers.includes('МЕТ-11') || headers.includes('МТ-11') || 
           headers.includes('ИТ-21') || headers.includes('ИТ-22') ||
           headers.includes('ЕкДп-11') || headers.includes('А-11') ||
           headers.includes('Дні') || headers.includes('Дни'))) {
        
        // Grid format parsing - like current Ukrainian format
        const groupColumns = headers.slice(3); // Skip 'Дні', '№', 'Час'
        let currentDay = '';
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const dayCell = String(row[0] || '').trim();
          const timeCell = String(row[2] || '').trim();
          
          // Update current day if this row has a day name
          if (dayCell && (dayCell.includes('ПОНЕДІЛЬОК') || dayCell.includes('ПОНЕДЕЛЬНИК') ||
                         dayCell.includes('ВІВТОРОК') || dayCell.includes('ВТОРНИК') || 
                         dayCell.includes('СЕРЕДА') || dayCell.includes('СРЕДА') || 
                         dayCell.includes('ЧЕТВЕР') || dayCell.includes('ЧЕТВЕРГ') || 
                         dayCell.includes('П\'ЯТНИЦЯ') || dayCell.includes('ПЯТНИЦА') || 
                         dayCell.includes('СУББОТА'))) {
            // Convert Ukrainian to Russian day names
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
          }
          
          // Parse time slots
          if (timeCell && (timeCell.includes('-') || timeCell.includes('.')) && currentDay) {
            // Handle different time formats: "9.00-10.20" or "09:00-10:30"
            const normalizedTime = timeCell.replace(/\./g, ':');
            const timeMatch = normalizedTime.match(/(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})/);
            if (!timeMatch) continue;
            
            const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            
            // Process each group column
            for (let colIndex = 0; colIndex < groupColumns.length; colIndex++) {
              const groupName = groupColumns[colIndex];
              const cellContent = String(row[colIndex + 3] || '').trim();
              
              if (cellContent && !cellContent.includes('Предмет') && !cellContent.includes('Назва')) {
                // Parse different formats
                let subject = '', teacher = '', classroom = '';
                
                if (cellContent.includes('|')) {
                  // Compact format: Subject | Teacher | Classroom
                  const parts = cellContent.split('|').map(p => p.trim());
                  subject = parts[0] || '';
                  teacher = parts[1] || '';
                  classroom = parts[2] || '';
                } else {
                  // Current format: multiline text
                  const lines = cellContent.split('\n').map(l => l.trim()).filter(l => l);
                  if (lines.length >= 2) {
                    subject = lines[0];
                    teacher = lines[lines.length - 1]; // Last line is usually teacher
                    // Find classroom in any line
                    for (const line of lines) {
                      if (line.includes('каб') || line.includes('Лаб') || /^\d+$/.test(line) || /^[А-Я]-\d+$/.test(line)) {
                        classroom = line;
                        break;
                      }
                    }
                  } else if (lines.length === 1) {
                    // Single line - try to parse
                    const parts = lines[0].split(/\s+/);
                    subject = parts.slice(0, -1).join(' ');
                    teacher = parts[parts.length - 1];
                  }
                }
                
                if (subject && teacher) {
                  jsonData.push({
                    'День недели': currentDay,
                    'Время начала': startTime,
                    'Время окончания': endTime,
                    'Предмет': subject,
                    'Преподаватель': teacher,
                    'Группа': groupName,
                    'Аудитория': classroom || 'Не указана'
                  });
                }
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
        
        // Dynamic group detection for each row (for vertical format)
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const dayCell = String(row[0] || '').trim();
          
          // Check if this row contains group headers
          const currentRowGroups: Array<{name: string, startCol: number}> = [];
          for (let colIndex = 1; colIndex < row.length; colIndex++) {
            const cell = String(row[colIndex] || '').trim();
            if (cell && (cell.includes('ИТ-') || cell.includes('ЭК-') || 
                        cell.includes('А-') || cell.includes('М-') ||
                        /^[А-Я]+-\d+$/.test(cell))) {
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
          
          // Parse time slots
          const timeCell = String(row[0] || '').trim();
          if (timeCell && timeCell.includes('-') && currentDay && groupsInfo.length > 0) {
            const normalizedTime = timeCell.replace(/\./g, ':');
            const timeMatch = normalizedTime.match(/(\d{1,2}):?(\d{2})-(\d{1,2}):?(\d{2})/);
            if (!timeMatch) continue;
            
            const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;
            
            // Process each group
            for (const group of groupsInfo) {
              const subject = String(row[group.startCol] || '').trim();
              const teacher = String(row[group.startCol + 1] || '').trim();
              const classroom = String(row[group.startCol + 2] || '').trim();
              
              if (subject && teacher && classroom) {
                jsonData.push({
                  'День недели': currentDay,
                  'Время начала': startTime,
                  'Время окончания': endTime,
                  'Предмет': subject,
                  'Преподаватель': teacher,
                  'Группа': group.name,
                  'Аудитория': classroom
                });
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
        return res.status(400).json({ message: "Excel файл не содержит данных" });
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
            errors.push(`Строка ${rowNumber}: отсутствуют обязательные поля`);
            continue;
          }

          // Validate day of week
          const validDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
          if (!validDays.includes(lesson.dayOfWeek)) {
            errors.push(`Строка ${rowNumber}: неверный день недели "${lesson.dayOfWeek}"`);
            continue;
          }

          // Validate time format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(lesson.startTime) || !timeRegex.test(lesson.endTime)) {
            errors.push(`Строка ${rowNumber}: неверный формат времени`);
            continue;
          }

          const validatedLesson = insertLessonSchema.parse(lesson);
          lessons.push(validatedLesson);
        } catch (error) {
          errors.push(`Строка ${rowNumber}: ошибка валидации данных`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Обнаружены ошибки в данных",
          errors: errors.slice(0, 10) // Limit to first 10 errors
        });
      }

      if (lessons.length === 0) {
        return res.status(400).json({ message: "Не найдено корректных записей" });
      }

      // Clear existing lessons and add new ones
      await storage.clearAllLessons();
      await storage.createManyLessons(lessons);

      res.json({ 
        message: "Расписание успешно загружено",
        lessonsCount: lessons.length 
      });
    } catch (error) {
      console.error('Excel upload error:', error);
      res.status(500).json({ message: "Ошибка обработки файла" });
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
        
        // Объединение ячеек для заголовков групп (5 групп)
        const merges = [];
        for (let i = 0; i < 5; i++) {
          const startCol = 1 + (i * 3);
          const endCol = startCol + 2;
          merges.push({ s: { c: startCol, r: 2 }, e: { c: endCol, r: 2 } });
        }
        worksheet['!merges'] = merges;
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
