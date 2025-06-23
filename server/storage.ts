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
    const sampleLessons: InsertLesson[] = [
      {
        dayOfWeek: "Понедельник",
        startTime: "09:00",
        endTime: "10:30",
        subject: "Программирование",
        teacher: "Иванов И.И.",
        group: "ИТ-21",
        classroom: "101",
        lessonType: "Лекция"
      },
      {
        dayOfWeek: "Понедельник",
        startTime: "10:45",
        endTime: "12:15",
        subject: "Базы данных",
        teacher: "Петров П.П.",
        group: "ИТ-21",
        classroom: "Лаб. 1",
        lessonType: "Практика"
      },
      {
        dayOfWeek: "Вторник",
        startTime: "08:15",
        endTime: "09:45",
        subject: "Математика",
        teacher: "Сидоров С.С.",
        group: "ИТ-21",
        classroom: "102",
        lessonType: "Лекция"
      },
      {
        dayOfWeek: "Вторник",
        startTime: "10:00",
        endTime: "11:30",
        subject: "Веб-разработка",
        teacher: "Козлов К.К.",
        group: "ИТ-22",
        classroom: "201",
        lessonType: "Практика"
      },
      {
        dayOfWeek: "Среда",
        startTime: "09:00",
        endTime: "10:30",
        subject: "Сети и протоколы",
        teacher: "Николаев Н.Н.",
        group: "ИТ-21",
        classroom: "101",
        lessonType: "Лекция"
      },
      {
        dayOfWeek: "Среда",
        startTime: "10:45",
        endTime: "12:15",
        subject: "Физика",
        teacher: "Морозов М.М.",
        group: "ИТ-21",
        classroom: "102",
        lessonType: "Лекция"
      },
      {
        dayOfWeek: "Четверг",
        startTime: "09:00",
        endTime: "10:30",
        subject: "Системное администрирование",
        teacher: "Волков В.В.",
        group: "ИТ-22",
        classroom: "Лаб. 2",
        lessonType: "Практика"
      },
      {
        dayOfWeek: "Пятница",
        startTime: "08:15",
        endTime: "09:45",
        subject: "Английский язык",
        teacher: "Белова Б.Б.",
        group: "ИТ-21",
        classroom: "201",
        lessonType: "Семинар"
      },
      {
        dayOfWeek: "Пятница",
        startTime: "10:00",
        endTime: "11:30",
        subject: "Экономика",
        teacher: "Зайцев З.З.",
        group: "ЭК-21",
        classroom: "101",
        lessonType: "Лекция"
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
        lesson.group.toLowerCase().includes(searchLower)
      );
    }

    if (filters.group) {
      lessons = lessons.filter(lesson => lesson.group === filters.group);
    }

    if (filters.teacher) {
      lessons = lessons.filter(lesson => lesson.teacher === filters.teacher);
    }

    if (filters.classroom) {
      lessons = lessons.filter(lesson => lesson.classroom === filters.classroom);
    }

    return lessons;
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
