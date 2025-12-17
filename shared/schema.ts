import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(), // "Понедельник", "Вторник", etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "10:30"
  subject: text("subject").notNull(),
  teacher: text("teacher").notNull(),
  group: text("group").notNull(),
  classroom: text("classroom").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Filter types
export const scheduleFiltersSchema = z.object({
  search: z.string().optional()
});

export type ScheduleFilters = z.infer<typeof scheduleFiltersSchema>;

// Statistics type
export type ScheduleStatistics = {
  totalLessons: number;
  activeGroups: number;
  teachers: number;
  classrooms: number;
};
