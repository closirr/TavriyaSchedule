import { lessons, type Lesson, type InsertLesson, type ScheduleFilters, type ScheduleStatistics } from "@shared/schema";

export interface IStorage {
  // Lessons
  getAllLessons(): Promise<Lesson[]>;
  getLessonsFiltered(filters: ScheduleFilters): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  createManyLessons(lessons: InsertLesson[]): Promise<Lesson[]>;
  clearAllLessons(): Promise<void>;
  
  // Statistics
  getStatistics(): Promise<ScheduleStatistics>;
  
  // Filter options
  getAllGroups(): Promise<string[]>;
  getAllTeachers(): Promise<string[]>;
  getAllClassrooms(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private lessons: Map<number, Lesson>;
  private currentId: number;

  constructor() {
    this.lessons = new Map();
    this.currentId = 1;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Загружаем реалистичные данные для Таврического колледжа
    const sampleLessons: InsertLesson[] = [
      // Понедельник
      {
        dayOfWeek: "Понедельник",
        startTime: "08:30",
        endTime: "10:00",
        subject: "Основы программирования",
        teacher: "Иванов Иван Иванович",
        group: "ИТ-21",
        classroom: "101"
      },
      {
        dayOfWeek: "Понедельник",
        startTime: "10:15",
        endTime: "11:45",
        subject: "Базы данных",
        teacher: "Петрова Мария Сергеевна",
        group: "ИТ-21",
        classroom: "Лаб-1"
      },
      {
        dayOfWeek: "Понедельник",
        startTime: "12:15",
        endTime: "13:45",
        subject: "Веб-разработка",
        teacher: "Сидоров Алексей Васильевич",
        group: "ИТ-22",
        classroom: "201"
      },
      {
        dayOfWeek: "Понедельник",
        startTime: "14:00",
        endTime: "15:30",
        subject: "Экономика предприятия",
        teacher: "Козлова Елена Петровна",
        group: "ЭК-21",
        classroom: "301"
      },
      
      // Вторник
      {
        dayOfWeek: "Вторник",
        startTime: "08:30",
        endTime: "10:00",
        subject: "Математика",
        teacher: "Николаев Владимир Дмитриевич",
        group: "ИТ-21",
        classroom: "102"
      },
      {
        dayOfWeek: "Вторник",
        startTime: "10:15",
        endTime: "11:45",
        subject: "Операционные системы",
        teacher: "Морозов Сергей Александрович",
        group: "ИТ-22",
        classroom: "Лаб-2"
      },
      {
        dayOfWeek: "Вторник",
        startTime: "12:15",
        endTime: "13:45",
        subject: "Физическая культура",
        teacher: "Волков Андрей Игоревич",
        group: "ИТ-21",
        classroom: "Спортзал"
      },
      
      // Среда
      {
        dayOfWeek: "Среда",
        startTime: "08:30",
        endTime: "10:00",
        subject: "Сетевые технологии",
        teacher: "Зайцев Михаил Юрьевич",
        group: "ИТ-21",
        classroom: "Лаб-1"
      },
      {
        dayOfWeek: "Среда",
        startTime: "10:15",
        endTime: "11:45",
        subject: "Алгоритмы и структуры данных",
        teacher: "Иванов Иван Иванович",
        group: "ИТ-22",
        classroom: "103"
      },
      {
        dayOfWeek: "Среда",
        startTime: "12:15",
        endTime: "13:45",
        subject: "Английский язык",
        teacher: "Смирнова Анна Викторовна",
        group: "ИТ-21",
        classroom: "204"
      },
      
      // Четверг
      {
        dayOfWeek: "Четверг",
        startTime: "08:30",
        endTime: "10:00",
        subject: "Информационная безопасность",
        teacher: "Романов Дмитрий Олегович",
        group: "ИТ-21",
        classroom: "105"
      },
      {
        dayOfWeek: "Четверг",
        startTime: "10:15",
        endTime: "11:45",
        subject: "Мобильная разработка",
        teacher: "Павлова Екатерина Сергеевна",
        group: "ИТ-22",
        classroom: "Лаб-3"
      },
      
      // Пятница
      {
        dayOfWeek: "Пятница",
        startTime: "08:30",
        endTime: "10:00",
        subject: "Проектирование ПО",
        teacher: "Соколов Виктор Михайлович",
        group: "ИТ-21",
        classroom: "106"
      },
      {
        dayOfWeek: "Пятница",
        startTime: "10:15",
        endTime: "11:45",
        subject: "Тестирование ПО",
        teacher: "Лебедева Ирина Владимировна",
        group: "ИТ-22",
        classroom: "Лаб-2"
      }
    ];

    sampleLessons.forEach(lesson => {
      this.createLesson(lesson);
    });
  }

  async getAllLessons(): Promise<Lesson[]> {
    return Array.from(this.lessons.values());
  }

  async getLessonsFiltered(filters: ScheduleFilters): Promise<Lesson[]> {
    let lessons = Array.from(this.lessons.values());

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      lessons = lessons.filter(lesson => 
        lesson.subject.toLowerCase().includes(searchLower) ||
        lesson.teacher.toLowerCase().includes(searchLower) ||
        lesson.group.toLowerCase().includes(searchLower) ||
        lesson.classroom.toLowerCase().includes(searchLower)
      );
    }

    // Sort by day and time
    return lessons.sort((a, b) => {
      const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.currentId++;
    const lesson: Lesson = { 
      ...insertLesson, 
      id,
      createdAt: new Date()
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  async createManyLessons(insertLessons: InsertLesson[]): Promise<Lesson[]> {
    const lessons: Lesson[] = [];
    for (const insertLesson of insertLessons) {
      const lesson = await this.createLesson(insertLesson);
      lessons.push(lesson);
    }
    return lessons;
  }

  async clearAllLessons(): Promise<void> {
    this.lessons.clear();
  }

  async getStatistics(): Promise<ScheduleStatistics> {
    const lessons = Array.from(this.lessons.values());
    
    const groups = new Set(lessons.map(l => l.group));
    const teachers = new Set(lessons.map(l => l.teacher));
    const classrooms = new Set(lessons.map(l => l.classroom));

    return {
      totalLessons: lessons.length,
      activeGroups: groups.size,
      teachers: teachers.size,
      classrooms: classrooms.size
    };
  }

  async getAllGroups(): Promise<string[]> {
    const lessons = Array.from(this.lessons.values());
    const groups = Array.from(new Set(lessons.map(l => l.group)));
    return groups.sort();
  }

  async getAllTeachers(): Promise<string[]> {
    const lessons = Array.from(this.lessons.values());
    const teachers = Array.from(new Set(lessons.map(l => l.teacher)));
    return teachers.sort();
  }

  async getAllClassrooms(): Promise<string[]> {
    const lessons = Array.from(this.lessons.values());
    const classrooms = Array.from(new Set(lessons.map(l => l.classroom)));
    return classrooms.sort();
  }
}

export const storage = new MemStorage();
