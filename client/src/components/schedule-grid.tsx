import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User, Users, RefreshCw } from "lucide-react";
import type { Lesson, WeekNumber } from "@/types/schedule";

/**
 * Маппінг часу початку пари до номера пари
 * Стандартний розклад дзвінків
 */
const LESSON_TIME_TO_NUMBER: Record<string, number> = {
  '09:00': 1,
  '9:00': 1,
  '10:30': 2,
  '12:30': 3,
  '14:00': 4,
  '15:30': 5,
};

/**
 * Визначає номер пари за часом початку
 */
function getLessonNumber(startTime: string): number | null {
  if (LESSON_TIME_TO_NUMBER[startTime]) {
    return LESSON_TIME_TO_NUMBER[startTime];
  }
  const withoutLeadingZero = startTime.replace(/^0/, '');
  if (LESSON_TIME_TO_NUMBER[withoutLeadingZero]) {
    return LESSON_TIME_TO_NUMBER[withoutLeadingZero];
  }
  const withLeadingZero = startTime.replace(/^(\d):/, '0$1:');
  if (LESSON_TIME_TO_NUMBER[withLeadingZero]) {
    return LESSON_TIME_TO_NUMBER[withLeadingZero];
  }
  return null;
}

/**
 * Генерує унікальний ключ для групування мигалок
 * Ключ базується на часі і групі — предмет/викладач можуть відрізнятись
 */
function getLessonSlotKey(lesson: Lesson): string {
  return `${lesson.dayOfWeek}-${lesson.startTime}-${lesson.endTime}-${lesson.group}`;
}

/**
 * Тип для згрупованих занять (звичайні або мигалки)
 */
interface LessonSlot {
  key: string;
  week1Lesson?: Lesson;
  week2Lesson?: Lesson;
  regularLesson?: Lesson;
  isAlternating: boolean;
}

interface ScheduleGridProps {
  lessons: Lesson[];
  isLoading: boolean;
  selectedGroup?: string;
  selectedTeacher?: string;
  selectedClassroom?: string;
  searchQuery?: string;
  currentWeek?: WeekNumber;
}

/**
 * Компонент картки заняття з підтримкою flip-анімації для мигалок
 */
function LessonCard({ 
  slot, 
  index, 
  isCurrent, 
  currentWeek 
}: { 
  slot: LessonSlot; 
  index: number; 
  isCurrent: boolean;
  currentWeek?: WeekNumber;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Для мигалок визначаємо яке заняття показувати спочатку
  const frontLesson = slot.isAlternating 
    ? (currentWeek === 2 ? slot.week2Lesson : slot.week1Lesson)
    : slot.regularLesson;
  const backLesson = slot.isAlternating 
    ? (currentWeek === 2 ? slot.week1Lesson : slot.week2Lesson)
    : null;

  if (!frontLesson) return null;

  const handleFlip = () => {
    if (slot.isAlternating && backLesson) {
      setIsFlipped(!isFlipped);
    }
  };

  const renderLessonContent = (lesson: Lesson, isBack: boolean = false) => {
    const weekLabel = lesson.weekNumber === 1 ? '1-й тиждень' : '2-й тиждень';
    const isActiveWeek = currentWeek === lesson.weekNumber;
    
    return (
      <Card 
        className={`
          border-0 shadow-sm overflow-hidden transition-all bg-white
          ${isCurrent && !isBack ? 'ring-2 ring-navy-400 shadow-lg' : ''}
          ${!isActiveWeek && lesson.weekNumber ? 'opacity-60' : ''}
        `}
      >
        <div className="flex">
          {/* Time Column */}
          <div className={`w-20 md:w-28 flex-shrink-0 p-3 md:p-4 flex flex-col items-center justify-center ${
            slot.isAlternating ? 'bg-amber-50' : 'bg-navy-50'
          }`}>
            <div className="text-xl md:text-2xl font-bold text-navy-700">
              {getLessonNumber(lesson.startTime) || (index + 1)}
            </div>
            <div className="w-full my-2 border-t border-gray-400" />
            <div className="text-base md:text-lg text-navy-700">
              {lesson.startTime}
            </div>
            <div className="text-xs text-gray-400">—</div>
            <div className="text-sm text-navy-600">
              {lesson.endTime}
            </div>
            {isCurrent && !isBack && (
              <span className="mt-2 px-2 py-0.5 bg-navy-600 text-white text-xs rounded-full">
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
                  <span className={`px-2 py-0.5 text-[11px] md:text-xs font-semibold rounded-md border ${
                    isActiveWeek 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {weekLabel}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  // Звичайне заняття без мигалки
  if (!slot.isAlternating) {
    return renderLessonContent(frontLesson);
  }

  // Мигалка з flip-анімацією
  return (
    <div 
      className={`flip-card stacked-card cursor-pointer ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
      title="Натисніть, щоб побачити заняття іншого тижня"
    >
      {/* Індикатор мигалки */}
      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-md">
        <RefreshCw className="w-3 h-3" />
        <span>Мигалка</span>
      </div>
      
      <div className="flip-card-inner">
        {/* Front side */}
        <div className="flip-card-front">
          {renderLessonContent(frontLesson)}
        </div>
        
        {/* Back side */}
        {backLesson && (
          <div className="flip-card-back">
            {renderLessonContent(backLesson, true)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScheduleGrid({ 
  lessons, 
  isLoading, 
  selectedGroup, 
  selectedTeacher,
  selectedClassroom,
  searchQuery,
  currentWeek 
}: ScheduleGridProps) {
  const daysOfWeek = [
    'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'
  ];

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });

  const hasActiveFilter = selectedGroup || selectedTeacher || selectedClassroom || searchQuery;

  // Групуємо заняття в слоти (мигалки об'єднуються)
  const lessonSlots = useMemo(() => {
    const slotMap = new Map<string, LessonSlot>();
    
    lessons.forEach(lesson => {
      const key = getLessonSlotKey(lesson);
      const existing = slotMap.get(key);
      
      if (lesson.weekNumber) {
        // Заняття з номером тижня — потенційна мигалка
        if (existing) {
          // Додаємо до існуючого слоту
          if (lesson.weekNumber === 1) {
            existing.week1Lesson = lesson;
          } else {
            existing.week2Lesson = lesson;
          }
          // Мигалка якщо є обидва тижні
          existing.isAlternating = !!(existing.week1Lesson && existing.week2Lesson);
        } else {
          slotMap.set(key, {
            key,
            week1Lesson: lesson.weekNumber === 1 ? lesson : undefined,
            week2Lesson: lesson.weekNumber === 2 ? lesson : undefined,
            isAlternating: false,
          });
        }
      } else {
        // Звичайне заняття без номера тижня
        if (!existing) {
          slotMap.set(key, {
            key,
            regularLesson: lesson,
            isAlternating: false,
          });
        } else if (!existing.regularLesson) {
          existing.regularLesson = lesson;
        }
      }
    });
    
    // Конвертуємо неповні мигалки (тільки один тиждень) у звичайні заняття
    slotMap.forEach((slot) => {
      if (!slot.isAlternating && !slot.regularLesson) {
        const singleLesson = slot.week1Lesson || slot.week2Lesson;
        if (singleLesson) {
          slot.regularLesson = singleLesson;
          slot.week1Lesson = undefined;
          slot.week2Lesson = undefined;
        }
      }
    });
    
    return Array.from(slotMap.values());
  }, [lessons]);

  if (!hasActiveFilter && !isLoading) {
    return (
      <div className="mb-8 p-12 bg-white rounded-2xl border border-gray-200 text-center">
        <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-navy-600" />
        </div>
        <p className="text-gray-600 text-lg font-medium">Оберіть групу, викладача або аудиторію</p>
        <p className="text-gray-400 text-sm mt-2">Використайте пошук вище</p>
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

  const groupSlotsByDay = (slots: LessonSlot[]) => {
    const grouped: Record<string, LessonSlot[]> = {};
    daysOfWeek.forEach(day => {
      grouped[day] = slots
        .filter(slot => {
          const lesson = slot.regularLesson || slot.week1Lesson || slot.week2Lesson;
          return lesson?.dayOfWeek === day;
        })
        .sort((a, b) => {
          const lessonA = a.regularLesson || a.week1Lesson || a.week2Lesson;
          const lessonB = b.regularLesson || b.week1Lesson || b.week2Lesson;
          return (lessonA?.startTime || '').localeCompare(lessonB?.startTime || '');
        });
    });
    return grouped;
  };

  const isCurrentDay = (dayIndex: number) => {
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;
    return dayIndex === todayIndex;
  };

  const isCurrentLesson = (slot: LessonSlot, dayIndex: number) => {
    if (!isCurrentDay(dayIndex)) return false;
    const lesson = slot.regularLesson || slot.week1Lesson || slot.week2Lesson;
    if (!lesson) return false;
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

  const groupedSlots = groupSlotsByDay(lessonSlots);
  const currentDaySlots = groupedSlots[daysOfWeek[selectedDay]] || [];

  return (
    <div className="mb-8">
      {/* Day Selector - Desktop */}
      <div className="hidden md:flex gap-1.5 mb-6 justify-center flex-wrap">
        {daysOfWeek.map((day, index) => {
          const daySlots = groupedSlots[day] || [];
          const isToday = isCurrentDay(index);
          const isSelected = selectedDay === index;
          const hasLessons = daySlots.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(index)}
              className={`
                px-3 py-2.5 rounded-lg font-medium transition-all min-w-[90px] relative text-center
                ${isToday
                  ? isSelected
                    ? hasLessons 
                      ? 'bg-blue-50 text-navy-700 border-[3px] border-navy-600'
                      : 'bg-gray-100 text-navy-700 border-[3px] border-navy-600'
                    : hasLessons
                      ? 'bg-blue-50 text-navy-700 border-2 border-blue-300 hover:bg-blue-100'
                      : 'bg-gray-100 text-navy-700 border-2 border-blue-300 hover:bg-gray-200'
                  : isSelected
                    ? 'bg-white text-navy-700 border-[3px] border-navy-600'
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
                  {daySlots.length} {daySlots.length === 1 ? 'пара' : daySlots.length < 5 ? 'пари' : 'пар'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Selector - Mobile */}
      <div className="md:hidden mb-6 -mx-4 px-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {daysOfWeek.map((day, index) => {
              const daySlots = groupedSlots[day] || [];
              const isToday = isCurrentDay(index);
              const isSelected = selectedDay === index;
              const hasLessons = daySlots.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={`
                    px-4 py-3 rounded-xl font-medium transition-all min-w-[100px] flex-shrink-0 relative
                    ${isToday
                      ? isSelected
                        ? hasLessons
                          ? 'bg-blue-50 text-navy-700 border-[3px] border-navy-600'
                          : 'bg-gray-100 text-navy-700 border-[3px] border-navy-600'
                        : hasLessons
                          ? 'bg-blue-50 text-navy-700 border-2 border-blue-300'
                          : 'bg-gray-100 text-navy-700 border-2 border-blue-300'
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
                      {daySlots.length} {daySlots.length === 1 ? 'пара' : daySlots.length < 5 ? 'пари' : 'пар'}
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
        {currentDaySlots.length === 0 ? (
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
          currentDaySlots.map((slot, index) => (
            <div key={slot.key} className="relative">
              <LessonCard 
                slot={slot}
                index={index}
                isCurrent={isCurrentLesson(slot, selectedDay)}
                currentWeek={currentWeek}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
