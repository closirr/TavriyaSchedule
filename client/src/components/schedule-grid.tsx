import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { type Lesson, type ScheduleFilters } from "@shared/schema";

interface ScheduleGridProps {
  filters: ScheduleFilters;
}

export default function ScheduleGrid({ filters }: ScheduleGridProps) {
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['/api/lessons', filters],
  });

  const daysOfWeek = [
    'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
  ];
  
  const dayDisplayNames = [
    'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'
  ];

  const getDayDate = (dayIndex: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    
    const targetDay = new Date(monday);
    targetDay.setDate(monday.getDate() + dayIndex);
    
    return targetDay.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  };

  const groupLessonsByDay = (lessons: Lesson[]) => {
    const grouped: Record<string, Lesson[]> = {};
    
    daysOfWeek.forEach(day => {
      grouped[day] = lessons
        .filter(lesson => lesson.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  const isCurrentDay = (dayName: string) => {
    const today = new Date().toLocaleDateString('uk-UA', { weekday: 'long' });
    const dayMapping: Record<string, string> = {
      'понедельник': 'понеділок',
      'вторник': 'вівторок', 
      'среда': 'середа',
      'четверг': 'четвер',
      'пятница': 'п\'ятниця',
      'суббота': 'субота',
      'воскресенье': 'неділя'
    };
    
    // Convert database day name (Russian) to Ukrainian
    const ukrainianDay = dayMapping[dayName.toLowerCase()] || dayName;
    return today.toLowerCase() === ukrainianDay.toLowerCase();
  };

  const isCurrentLesson = (lesson: Lesson) => {
    if (!isCurrentDay(lesson.dayOfWeek)) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= lesson.startTime && currentTime <= lesson.endTime;
  };

  // Removed getLessonTypeColor function since lessonType field is no longer used

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {dayDisplayNames.map((day) => (
            <Card key={day} className="animate-pulse">
              <div className="bg-gray-300 h-16 rounded-t-xl"></div>
              <CardContent className="p-4 space-y-3">
                <div className="bg-gray-200 h-20 rounded"></div>
                <div className="bg-gray-200 h-20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const groupedLessons = groupLessonsByDay(lessons);

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day, index) => {
          const dayLessons = groupedLessons[day] || [];
          const isToday = isCurrentDay(day);
          const hasLessons = dayLessons.length > 0;
          const displayDay = dayDisplayNames[index];

          return (
            <Card key={day} className="overflow-hidden border border-gray-200">
              <div className={`px-4 py-3 ${
                isToday ? 'bg-navy-700' : hasLessons ? 'bg-navy-600' : 'bg-gray-400'
              }`}>
                <h3 className="font-semibold text-white text-center">{displayDay}</h3>
                <p className={`text-sm text-center ${
                  isToday ? 'text-navy-100' : hasLessons ? 'text-navy-100' : 'text-gray-100'
                }`}>
                  {getDayDate(index)}
                  {isToday && ' • Сьогодні'}
                </p>
              </div>
              
              <CardContent className="p-4">
                {dayLessons.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[120px]">
                    <p className="text-gray-400 text-sm text-center">Занять немає</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayLessons.map((lesson) => {
                      const isCurrent = isCurrentLesson(lesson);
                      
                      return (
                        <div 
                          key={lesson.id} 
                          className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                            isCurrent ? 'border-2 border-navy-300 bg-navy-50 shadow-md' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              isCurrent ? 'text-navy-700' : 'text-navy-600'
                            }`}>
                              {lesson.startTime} - {lesson.endTime}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isCurrent ? 'text-navy-700 bg-navy-200 font-medium' : 'text-gray-500 bg-gray-100'
                            }`}>
                              {lesson.classroom}
                            </span>
                          </div>
                          
                          <h4 className="font-medium text-navy-700 text-sm mb-1">
                            {lesson.subject}
                          </h4>
                          
                          <p className="text-xs text-gray-600 mb-2">
                            {lesson.teacher}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {lesson.group}
                            </span>
                            {isCurrent && (
                              <span className="text-xs font-medium text-navy-700">
                                Поточна
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
