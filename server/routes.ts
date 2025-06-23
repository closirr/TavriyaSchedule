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
        workbook = XLSX.read(req.file.buffer, { 
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
      } catch (parseError) {
        console.error('Excel parse error:', parseError);
        return res.status(400).json({ message: "Ошибка чтения Excel файла. Убедитесь, что файл имеет правильный формат .xlsx" });
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
      // Create template data
      const templateData = [
        {
          'День недели': 'Понедельник',
          'Время начала': '09:00',
          'Время окончания': '10:30',
          'Предмет': 'Программирование',
          'Преподаватель': 'Иванов И.И.',
          'Группа': 'ИТ-21',
          'Аудитория': '101',
          'Тип занятия': 'Лекция'
        },
        {
          'День недели': 'Понедельник',
          'Время начала': '10:45',
          'Время окончания': '12:15',
          'Предмет': 'Базы данных',
          'Преподаватель': 'Петров П.П.',
          'Группа': 'ИТ-21',
          'Аудитория': 'Лаб. 1',
          'Тип занятия': 'Практика'
        }
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Расписание');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename=template_schedule.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: "Ошибка создания шаблона" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
