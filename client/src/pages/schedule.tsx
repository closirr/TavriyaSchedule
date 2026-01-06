import { GraduationCap, Printer } from "lucide-react";
import ScheduleFilters from "@/components/schedule-filters";
import ScheduleGrid from "@/components/schedule-grid";
import { useScheduleData } from "@/hooks/useScheduleData";
import { Button } from "@/components/ui/button";
import { SchedulePrinter, convertLessonsToPrinterFormat } from "@/lib/schedule-printer";
import { useToast } from "@/hooks/use-toast";

export default function Schedule() {
  const {
    lessons,
    filteredLessons,
    filters,
    setFilters,
    filterOptions,
    isLoading,
    metadata,
    currentWeek,
    isWeekManual,
  } = useScheduleData();
  const { toast } = useToast();

  const handlePrint = () => {
    // Друкуємо всі групи з усіма уроками (включаючи мигалки для обох тижнів)
    if (lessons.length === 0) {
      toast({
        title: "Помилка",
        description: "Немає даних для друку",
        variant: "destructive",
      });
      return;
    }

    // Для друку передаємо ВСІ уроки, щоб мигалки відображалися правильно
    // (уроки з weekNumber: 1 та weekNumber: 2 об'єднуються в одну комірку)
    const printerData = convertLessonsToPrinterFormat(
      lessons
      // семестр визначається автоматично
    );
    
    const printer = new SchedulePrinter({ groupsPerPage: 4 });
    printer.print(printerData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start gap-4 py-3 sm:items-center sm:py-0 sm:h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-lg" />
              </div>
              <div className="leading-snug">
                <h1 className="text-xl font-semibold text-navy-700">ВСП «КФКМГ ТНУ ім.В.І.Вернадського»</h1>
                <p className="text-sm text-gray-500">Розклад занять</p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Друк</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters with Week and Format Indicator */}
        <ScheduleFilters
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
          metadata={metadata}
          currentWeek={currentWeek}
          isWeekManual={isWeekManual}
          isLoading={isLoading}
        />

        {/* Schedule Grid */}
        <ScheduleGrid 
          lessons={filteredLessons} 
          isLoading={isLoading} 
          selectedGroup={filters.group} 
          selectedTeacher={filters.teacher}
          selectedClassroom={filters.classroom}
          searchQuery={filters.search}
          currentWeek={currentWeek} 
        />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 ВСП «КФКМГ ТНУ ім.В.І.Вернадського». Київ, Україна
          </p>
        </div>
      </footer>
    </div>
  );
}
