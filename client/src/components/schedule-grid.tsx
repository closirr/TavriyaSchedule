import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Users } from "lucide-react";
import type { Lesson } from "@/types/schedule";

interface ScheduleGridProps {
  lessons: Lesson[];
  isLoading: boolean;
  selectedGroup?: string;
}

export default function ScheduleGrid({ lessons, isLoading, selectedGroup }: ScheduleGridProps) {
  const daysOfWeek = [
    'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'
  ];

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convert Sunday=0 to index 6
  });

  if (!selectedGroup && !isLoading) {
    return (
      <div className="mb-8 p-12 bg-white rounded-2xl border border-gray-200 text-center">
        <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-navy-600" />
        </div>
        <p className="text-gray-600 text-lg font-medium">Оберіть групу для перегляду розкладу</p>
        <p className="text-gray-400 text-sm mt-2">Використайте фільтр вище</p>
      </div>
    );
  }

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

  const isCurrentDay = (dayIndex: number) => {
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;
    return dayIndex === todayIndex;
  };

  const isCurrentLesson = (lesson: Lesson, dayIndex: number) => {
    if (!isCurrentDay(dayIndex)) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= lesson.startTime && currentTime <= lesson.endTime;
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {daysOfWeek.map((_, i) => (
            <div key={i} className="h-12 w-28 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const groupedLessons = groupLessonsByDay(lessons);
  const currentDayLessons = groupedLessons[daysOfWeek[selectedDay]] || [];

  const navigateDay = (direction: number) => {
    setSelectedDay(prev => {
      const next = prev + direction;
      if (next < 0) return 6;
      if (next > 6) return 0;
      return next;
    });
  };

  return (
    <div className="mb-8">
      {/* Day Selector - Desktop */}
      <div className="hidden md:flex gap-2 mb-6 justify-center flex-wrap">
        {daysOfWeek.map((day, index) => {
          const dayLessons = groupedLessons[day] || [];
          const isToday = isCurrentDay(index);
          const isSelected = selectedDay === index;
          const hasLessons = dayLessons.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(index)}
              className={`
                px-4 py-3 rounded-xl font-medium transition-all min-w-[120px]
                ${isSelected 
                  ? 'bg-navy-600 text-white shadow-lg scale-105' 
                  : isToday
                    ? 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                    : hasLessons
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              <div className="text-sm">{day}</div>
              <div className={`text-xs mt-1 ${isSelected ? 'text-navy-200' : 'text-gray-400'}`}>
                {getDayDate(index)}
              </div>
              {hasLessons && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-navy-200' : 'text-gray-500'}`}>
                  {dayLessons.length} {dayLessons.length === 1 ? 'пара' : dayLessons.length < 5 ? 'пари' : 'пар'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Selector - Mobile */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200">
          <button 
            onClick={() => navigateDay(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="font-semibold text-navy-700 text-lg">{daysOfWeek[selectedDay]}</div>
            <div className="text-sm text-gray-500">{getDayDate(selectedDay)}</div>
            {isCurrentDay(selectedDay) && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-navy-100 text-navy-700 text-xs rounded-full">
                Сьогодні
              </span>
            )}
          </div>
          
          <button 
            onClick={() => navigateDay(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile day dots */}
        <div className="flex justify-center gap-2 mt-3">
          {daysOfWeek.map((day, index) => {
            const hasLessons = (groupedLessons[day] || []).length > 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  selectedDay === index 
                    ? 'bg-navy-600 w-6' 
                    : hasLessons 
                      ? 'bg-navy-300' 
                      : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        {currentDayLessons.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Занять немає</p>
              <p className="text-gray-400 text-sm mt-1">Вихідний день або пари не заплановані</p>
            </CardContent>
          </Card>
        ) : (
          currentDayLessons.map((lesson, index) => {
            const isCurrent = isCurrentLesson(lesson, selectedDay);
            
            return (
              <Card 
                key={lesson.id} 
                className={`
                  border-0 shadow-sm overflow-hidden transition-all hover:shadow-md
                  ${isCurrent ? 'ring-2 ring-navy-400 shadow-lg' : ''}
                `}
              >
                <div className="flex">
                  {/* Time Column */}
                  <div className={`
                    w-24 md:w-32 flex-shrink-0 p-4 flex flex-col items-center justify-center
                    ${isCurrent ? 'bg-navy-600' : 'bg-navy-50'}
                  `}>
                    <div className={`text-lg md:text-xl font-bold ${isCurrent ? 'text-white' : 'text-navy-700'}`}>
                      {lesson.startTime}
                    </div>
                    <div className={`text-xs ${isCurrent ? 'text-navy-200' : 'text-gray-400'}`}>—</div>
                    <div className={`text-sm md:text-base ${isCurrent ? 'text-navy-100' : 'text-navy-600'}`}>
                      {lesson.endTime}
                    </div>
                    {isCurrent && (
                      <span className="mt-2 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                        Зараз
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="flex-1 p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-navy-700 text-base md:text-lg leading-tight">
                          {lesson.subject}
                        </h3>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{lesson.teacher}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{lesson.classroom}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-2">
                        <span className="px-3 py-1.5 bg-navy-100 text-navy-700 text-sm font-medium rounded-lg">
                          {lesson.group}
                        </span>
                        <span className="text-xs text-gray-400">
                          Пара {index + 1}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      {currentDayLessons.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
            <span>
              <strong className="text-navy-700">{currentDayLessons.length}</strong> {currentDayLessons.length === 1 ? 'пара' : currentDayLessons.length < 5 ? 'пари' : 'пар'}
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Початок: <strong className="text-navy-700">{currentDayLessons[0]?.startTime}</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Кінець: <strong className="text-navy-700">{currentDayLessons[currentDayLessons.length - 1]?.endTime}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
