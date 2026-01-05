import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User, Users } from "lucide-react";
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

  return (
    <div className="mb-8">
      {/* Day Selector - Desktop */}
      <div className="hidden md:flex gap-1.5 mb-6 justify-center flex-wrap">
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
                px-3 py-2.5 rounded-lg font-medium transition-all min-w-[90px] relative text-center
                ${isToday
                  ? isSelected
                    ? 'bg-blue-50 text-navy-700 border-[3px] border-navy-600'
                    : 'bg-blue-50 text-navy-700 border-2 border-blue-300 hover:bg-blue-100'
                  : isSelected
                    ? 'bg-white text-navy-700 border-[3px] border-navy-600 hover:border-navy-700'
                    : hasLessons
                      ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      : 'bg-gray-100 text-gray-400'
                }
              `}
            >
              <div className="text-sm font-semibold">{day}</div>
              <div className={`text-xs mt-0.5 ${isToday ? 'text-blue-500' : isSelected ? 'text-navy-500' : 'text-gray-400'}`}>
                {getDayDate(index)}
              </div>
              {hasLessons && (
                <div className={`text-xs mt-0.5 ${isToday ? 'text-blue-500' : isSelected ? 'text-navy-500' : 'text-gray-500'}`}>
                  {dayLessons.length} {dayLessons.length === 1 ? 'пара' : dayLessons.length < 5 ? 'пари' : 'пар'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Selector - Mobile (scrollable buttons) */}
      <div className="md:hidden mb-6 -mx-4 px-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
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
                    px-4 py-3 rounded-xl font-medium transition-all min-w-[100px] flex-shrink-0 relative
                    ${isToday
                      ? isSelected
                        ? 'bg-blue-50 text-navy-700 border-[3px] border-navy-600'
                        : 'bg-blue-50 text-navy-700 border-2 border-blue-300'
                      : isSelected
                        ? 'bg-white text-navy-700 border-[3px] border-navy-600'
                        : hasLessons
                          ? 'bg-white text-gray-700 border border-gray-200'
                          : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  <div className="text-sm">{day}</div>
                  <div className={`text-xs mt-0.5 ${isToday ? 'text-blue-500' : isSelected ? 'text-navy-500' : 'text-gray-400'}`}>
                    {getDayDate(index)}
                  </div>
                  {hasLessons && (
                    <div className={`text-xs mt-0.5 ${isToday ? 'text-blue-500' : isSelected ? 'text-navy-500' : 'text-gray-500'}`}>
                      {dayLessons.length} {dayLessons.length === 1 ? 'пара' : dayLessons.length < 5 ? 'пари' : 'пар'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="max-w-4xl mx-auto space-y-4">
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
                    w-20 md:w-28 flex-shrink-0 p-3 md:p-4 flex flex-col items-center justify-center
                    ${isCurrent ? 'bg-navy-600' : 'bg-navy-50'}
                  `}>
                    <div className={`text-base md:text-lg font-bold ${isCurrent ? 'text-white' : 'text-navy-700'}`}>
                      {lesson.startTime}
                    </div>
                    <div className={`text-xs ${isCurrent ? 'text-navy-200' : 'text-gray-400'}`}>—</div>
                    <div className={`text-sm ${isCurrent ? 'text-navy-100' : 'text-navy-600'}`}>
                      {lesson.endTime}
                    </div>
                    {isCurrent && (
                      <span className="mt-2 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                        Зараз
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="flex-1 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-navy-700 text-sm md:text-base leading-tight truncate">
                          {lesson.subject}
                        </h3>
                        
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm truncate">{lesson.teacher}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm">{lesson.classroom}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-2 flex-shrink-0">
                        <span className="px-2.5 py-1 bg-navy-100 text-navy-700 text-xs md:text-sm font-medium rounded-md">
                          {lesson.group}
                        </span>
                        {lesson.weekNumber && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] md:text-xs font-semibold rounded-md border border-amber-100">
                            {lesson.weekNumber}-й тиждень
                          </span>
                        )}
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
