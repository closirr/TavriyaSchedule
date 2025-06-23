import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scheduleFiltersSchema, insertLessonSchema } from "@shared/schema";
import * as XLSX from 'xlsx';
import multer from 'multer';

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
      } catch (parseError) {
        console.error('Excel parse error:', parseError);
        // Try alternative parsing method
        try {
          workbook = XLSX.read(req.file.buffer, { type: 'array' });
        } catch (secondError) {
          console.error('Second Excel parse error:', secondError);
          return res.status(400).json({ 
            message: "Ошибка чтения Excel файла. Убедитесь, что файл имеет правильный формат .xlsx и не поврежден",
            details: `Ошибка: ${parseError.message}`
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

      // Преобразуем массив массивов в массив объектов
      if (data.length < 2) {
        return res.status(400).json({ message: "Excel файл должен содержать заголовки и хотя бы одну строку данных" });
      }

      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];
      
      const jsonData = rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });

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
      // Create template data as array of arrays for maximum compatibility
      const templateData = [
        ['День недели', 'Время начала', 'Время окончания', 'Предмет', 'Преподаватель', 'Группа', 'Аудитория', 'Тип занятия'],
        ['Понедельник', '08:30', '10:00', 'Основы программирования', 'Иванов Иван Иванович', 'ИТ-21', '101', 'Лекция'],
        ['Понедельник', '10:15', '11:45', 'Базы данных', 'Петрова Мария Сергеевна', 'ИТ-21', 'Лаб-1', 'Практика'],
        ['Понедельник', '12:15', '13:45', 'Веб-разработка', 'Сидоров Алексей Васильевич', 'ИТ-22', '201', 'Практика'],
        ['Вторник', '08:30', '10:00', 'Математика', 'Николаев Владимир Дмитриевич', 'ИТ-21', '102', 'Лекция'],
        ['Вторник', '10:15', '11:45', 'Операционные системы', 'Морозов Сергей Александрович', 'ИТ-22', 'Лаб-2', 'Практика'],
        ['Среда', '08:30', '10:00', 'Сетевые технологии', 'Зайцев Михаил Юрьевич', 'ИТ-21', 'Лаб-1', 'Практика'],
        ['Среда', '10:15', '11:45', 'Английский язык', 'Смирнова Анна Викторовна', 'ИТ-21', '204', 'Семинар'],
        ['Четверг', '08:30', '10:00', 'Информационная безопасность', 'Романов Дмитрий Олегович', 'ИТ-21', '105', 'Лекция'],
        ['Четверг', '10:15', '11:45', 'Мобильная разработка', 'Павлова Екатерина Сергеевна', 'ИТ-22', 'Лаб-3', 'Практика'],
        ['Пятница', '08:30', '10:00', 'Проектирование ПО', 'Соколов Виктор Михайлович', 'ИТ-21', '106', 'Семинар'],
        ['Пятница', '10:15', '11:45', 'Тестирование ПО', 'Лебедева Ирина Владимировна', 'ИТ-22', 'Лаб-2', 'Практика']
      ];

      // Create workbook from array
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // День недели
        { wch: 12 }, // Время начала
        { wch: 12 }, // Время окончания
        { wch: 30 }, // Предмет
        { wch: 25 }, // Преподаватель
        { wch: 8 },  // Группа
        { wch: 10 }, // Аудитория
        { wch: 12 }  // Тип занятия
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

  const httpServer = createServer(app);
  return httpServer;
}
