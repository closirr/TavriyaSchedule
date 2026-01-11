import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, User, Users } from "lucide-react";
import type { Lesson, WeekNumber, SubgroupNumber } from "@/types/schedule";

/**
 * Генерує унікальний ключ для групування мигалок
 * Ключ базується на часі і групі — предмет/викладач можуть відрізнятись
 */
function getLessonSlotKey(lesson: Lesson): string {
  return `${lesson.dayOfWeek}-${lesson.startTime}-${lesson.endTime}-${lesson.group}`;
}

/**
 * Тип для згрупованих занять (звичайні, мигалки або підгрупи)
 */
interface LessonSlot {
  key: string;
  /** Заняття для 1-го тижня (мигалки) */
  week1Lesson?: Lesson;
  /** Заняття для 2-го тижня (мигалки) */
  week2Lesson?: Lesson;
  /** Заняття для 1-ї підгрупи */
  subgroup1Lesson?: Lesson;
  /** Заняття для 2-ї підгрупи */
  subgroup2Lesson?: Lesson;
  /** Звичайне заняття без поділу */
  regularLesson?: Lesson;
  /** true якщо є мигалка (два тижні) */
  isAlternating: boolean;
  /** true якщо є поділ на підгрупи */
  isSubgroupSplit: boolean;
}

interface ScheduleGridProps {
  lessons: Lesson[];
  isLoading: boolean;
  selectedGroup?: string;
  selectedTeacher?: string;
  selectedClassroom?: string;
  searchQuery?: string;
  currentWeek?: WeekNumber;
  selectedSubgroup?: SubgroupNumber;
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
          ${!isActiveWeek && lesson.weekNumber ? 'opacity-70' : ''}
        `}
      >
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 md:w-28 flex-shrink-0 p-3 md:p-4 flex flex-col items-center justify-center bg-navy-50">
            <div className="text-xl md:text-2xl font-bold text-navy-700">
              {lesson.lessonNumber || (index + 1)}
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
                <h3 className="font-semibold text-navy-700 text-sm md:text-base leading-tight break-words">
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
                      ? 'bg-navy-100 text-navy-700 border-navy-200' 
                      : 'bg-amber-100 text-amber-700 border-amber-300'
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

/**
 * Компонент картки з поділом на підгрупи
 * Відображає дві підгрупи з горизонтальною лінією-розділювачем
 * Або спрощений вигляд для конкретної підгрупи
 */
function SubgroupCard({ 
  slot, 
  index, 
  isCurrent,
  selectedSubgroup
}: { 
  slot: LessonSlot; 
  index: number; 
  isCurrent: boolean;
  selectedSubgroup?: SubgroupNumber;
}) {
  const subgroup1 = slot.subgroup1Lesson;
  const subgroup2 = slot.subgroup2Lesson;
  
  // Отримуємо базову інформацію з будь-якого доступного заняття
  const baseLesson = subgroup1 || subgroup2;
  if (!baseLesson) return null;

  const renderSubgroupContent = (lesson: Lesson | undefined, subgroupLabel: string, showLabel: boolean = true) => {
    // Якщо немає заняття - не рендеримо нічого
    if (!lesson) return null;
    
    return (
      <div className="p-3 md:p-4 flex flex-col">
        {showLabel && (
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 bg-navy-100 text-navy-700 text-[10px] md:text-xs font-medium rounded">
              {subgroupLabel}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-navy-700 text-sm md:text-base leading-tight break-words">
            {lesson.subject}
          </h4>
          
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
      </div>
    );
  };

  // Якщо вибрана конкретна підгрупа - показуємо спрощений вигляд
  if (selectedSubgroup) {
    const selectedLesson = selectedSubgroup === 1 ? subgroup1 : subgroup2;
    if (!selectedLesson) return null;

    return (
      <Card 
        className={`
          border-0 shadow-sm overflow-hidden transition-all bg-white
          ${isCurrent ? 'ring-2 ring-navy-400 shadow-lg' : ''}
        `}
      >
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 md:w-28 flex-shrink-0 p-3 md:p-4 flex flex-col items-center justify-center bg-navy-50">
            <div className="text-xl md:text-2xl font-bold text-navy-700">
              {selectedLesson.lessonNumber || (index + 1)}
            </div>
            <div className="w-full my-2 border-t border-gray-400" />
            <div className="text-base md:text-lg text-navy-700">
              {selectedLesson.startTime}
            </div>
            <div className="text-xs text-gray-400">—</div>
            <div className="text-sm text-navy-600">
              {selectedLesson.endTime}
            </div>
            {isCurrent && (
              <span className="mt-2 px-2 py-0.5 bg-navy-600 text-white text-xs rounded-full">
                Зараз
              </span>
            )}
          </div>

          {/* Content - Single subgroup using same structure as full mode */}
          <div className="flex-1 flex flex-col">
            {renderSubgroupContent(selectedLesson, `${selectedSubgroup} підгрупа`, true)}
          </div>

          {/* Group badge */}
          <div className="flex items-center pr-3 md:pr-4">
            <span className="px-2.5 py-1 bg-navy-100 text-navy-700 text-xs md:text-sm font-medium rounded-md">
              {selectedLesson.group}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`
        border-0 shadow-sm overflow-hidden transition-all bg-white
        ${isCurrent ? 'ring-2 ring-navy-400 shadow-lg' : ''}
      `}
    >
      <div className="flex">
        {/* Time Column */}
        <div className="w-20 md:w-28 flex-shrink-0 p-3 md:p-4 flex flex-col items-center justify-center bg-navy-50">
          <div className="text-xl md:text-2xl font-bold text-navy-700">
            {baseLesson.lessonNumber || (index + 1)}
          </div>
          <div className="w-full my-2 border-t border-gray-400" />
          <div className="text-base md:text-lg text-navy-700">
            {baseLesson.startTime}
          </div>
          <div className="text-xs text-gray-400">—</div>
          <div className="text-sm text-navy-600">
            {baseLesson.endTime}
          </div>
          {isCurrent && (
            <span className="mt-2 px-2 py-0.5 bg-navy-600 text-white text-xs rounded-full">
              Зараз
            </span>
          )}
        </div>

        {/* Content - Split into two subgroups */}
        <div className="flex-1 flex flex-col">
          {/* Підгрупа 1 - зверху */}
          {renderSubgroupContent(subgroup1, '1 підгрупа')}
          
          {/* Горизонтальна лінія-розділювач - тільки якщо є обидві підгрупи */}
          {subgroup1 && subgroup2 && (
            <div className="border-t border-gray-300 mx-2" />
          )}
          
          {/* Підгрупа 2 - знизу */}
          {renderSubgroupContent(subgroup2, '2 підгрупа')}
        </div>

        {/* Group badge */}
        <div className="flex items-center pr-3 md:pr-4">
          <span className="px-2.5 py-1 bg-navy-100 text-navy-700 text-xs md:text-sm font-medium rounded-md">
            {baseLesson.group}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function ScheduleGrid({ 
  lessons, 
  isLoading, 
  selectedGroup, 
  selectedTeacher,
  selectedClassroom,
  searchQuery,
  currentWeek,
  selectedSubgroup
}: ScheduleGridProps) {
  const daysOfWeek = [
    'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'
  ];

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });

  const hasActiveFilter = selectedGroup || selectedTeacher || selectedClassroom || searchQuery;

  // Групуємо заняття в слоти (мигалки та підгрупи об'єднуються)
  const lessonSlots = useMemo(() => {
    const slotMap = new Map<string, LessonSlot>();
    
    lessons.forEach(lesson => {
      const key = getLessonSlotKey(lesson);
      const existing = slotMap.get(key);
      
      if (lesson.subgroupNumber) {
        // Заняття з номером підгрупи — поділ на підгрупи
        if (existing) {
          // Додаємо до існуючого слоту
          if (lesson.subgroupNumber === 1) {
            existing.subgroup1Lesson = lesson;
          } else {
            existing.subgroup2Lesson = lesson;
          }
          // Поділ на підгрупи якщо є хоча б одна підгрупа
          existing.isSubgroupSplit = !!(existing.subgroup1Lesson || existing.subgroup2Lesson);
        } else {
          slotMap.set(key, {
            key,
            subgroup1Lesson: lesson.subgroupNumber === 1 ? lesson : undefined,
            subgroup2Lesson: lesson.subgroupNumber === 2 ? lesson : undefined,
            isAlternating: false,
            isSubgroupSplit: true,
          });
        }
      } else if (lesson.weekNumber) {
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
            isSubgroupSplit: false,
          });
        }
      } else {
        // Звичайне заняття без номера тижня та підгрупи
        if (!existing) {
          slotMap.set(key, {
            key,
            regularLesson: lesson,
            isAlternating: false,
            isSubgroupSplit: false,
          });
        } else if (!existing.regularLesson) {
          existing.regularLesson = lesson;
        }
      }
    });
    
    // Конвертуємо неповні мигалки (тільки один тиждень) у звичайні заняття
    slotMap.forEach((slot) => {
      if (!slot.isAlternating && !slot.isSubgroupSplit && !slot.regularLesson) {
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
          // Враховуємо всі типи занять: звичайні, мигалки та підгрупи
          const lesson = slot.regularLesson || slot.week1Lesson || slot.week2Lesson || slot.subgroup1Lesson || slot.subgroup2Lesson;
          return lesson?.dayOfWeek === day;
        })
        .sort((a, b) => {
          const lessonA = a.regularLesson || a.week1Lesson || a.week2Lesson || a.subgroup1Lesson || a.subgroup2Lesson;
          const lessonB = b.regularLesson || b.week1Lesson || b.week2Lesson || b.subgroup1Lesson || b.subgroup2Lesson;
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
    // Враховуємо всі типи занять: звичайні, мигалки та підгрупи
    const lesson = slot.regularLesson || slot.week1Lesson || slot.week2Lesson || slot.subgroup1Lesson || slot.subgroup2Lesson;
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
              {slot.isSubgroupSplit ? (
                <SubgroupCard 
                  slot={slot}
                  index={index}
                  isCurrent={isCurrentLesson(slot, selectedDay)}
                  selectedSubgroup={selectedSubgroup}
                />
              ) : (
                <LessonCard 
                  slot={slot}
                  index={index}
                  isCurrent={isCurrentLesson(slot, selectedDay)}
                  currentWeek={currentWeek}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
