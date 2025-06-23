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

      const headers = data[0] as string[];
      const rows = data.slice(2) as any[][]; // Skip first 2 rows (headers and example)
      
      // Check if this is matrix format
      const isMatrixFormat = headers.length >= 3 && headers.includes('ИТ-21');
      
      let jsonData: any[] = [];
      
      if (isMatrixFormat) {
        // Parse matrix format
        for (const row of rows) {
          if (!row[0] || !row[1]) continue; // Skip empty or incomplete rows
          
          const day = String(row[0]).trim();
          const time = String(row[1]).trim();
          
          // Parse time range
          const timeMatch = time.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (!timeMatch) continue;
          
          const startTime = timeMatch[1];
          const endTime = timeMatch[2];
          
          // Process each group column (starting from column 2)
          for (let i = 2; i < headers.length; i++) {
            const groupName = headers[i];
            const cellValue = String(row[i] || '').trim();
            
            if (cellValue && cellValue !== '') {
              // Parse cell format: "Предмет - Преподаватель - Аудитория - Тип"
              const parts = cellValue.split(' - ');
              if (parts.length >= 4) {
                jsonData.push({
                  'День недели': day,
                  'Время начала': startTime,
                  'Время окончания': endTime,
                  'Предмет': parts[0],
                  'Преподаватель': parts[1],
                  'Группа': groupName,
                  'Аудитория': parts[2],
                  'Тип занятия': parts[3]
                });
              }
            }
          }
        }
      } else {
        // Standard format
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
            classroom: String(row['Аудитория'] || row['Classroom'] || '').trim(),
            lessonType: String(row['Тип занятия'] || row['Lesson Type'] || '').trim()
          };

          // Validate required fields
          if (!lesson.dayOfWeek || !lesson.startTime || !lesson.endTime || 
              !lesson.subject || !lesson.teacher || !lesson.group || 
              !lesson.classroom || !lesson.lessonType) {
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
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];

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
