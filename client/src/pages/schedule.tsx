import { useEffect } from "react";
import { GraduationCap, Printer } from "lucide-react";
import ScheduleFilters from "@/components/schedule-filters";
import ScheduleGrid from "@/components/schedule-grid";
import WeekFormatIndicator from "@/components/week-format-indicator";
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
  } = useScheduleData();
  const { toast } = useToast();

  // Автовибір тижня з метаданих (якщо не вибрано вручну)
  useEffect(() => {
    if (metadata?.currentWeek && !filters.weekNumber) {
      setFilters({ ...filters, weekNumber: metadata.currentWeek });
    }
  }, [metadata?.currentWeek, filters, setFilters]);

  const handlePrint = () => {
    // Друкуємо всі групи, але з урахуванням вибраного тижня
    if (lessons.length === 0) {
      toast({
        title: "Помилка",
        description: "Немає даних для друку",
        variant: "destructive",
      });
      return;
    }

    const lessonsForPrint = filters.weekNumber
      ? lessons.filter(lesson => !lesson.weekNumber || lesson.weekNumber === filters.weekNumber)
      : lessons;

    const printerData = convertLessonsToPrinterFormat(
      lessonsForPrint,
      "2 семестр 2024–2025 н.р."
    );
    
    const printer = new SchedulePrinter({ groupsPerPage: 4 });
    printer.print(printerData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-navy-700">Таврійський Коледж</h1>
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
        {/* Filters */}
        <ScheduleFilters
          filters={filters}
          filterOptions={filterOptions}
          onFiltersChange={setFilters}
          currentWeek={metadata?.currentWeek ?? null}
        />

        {/* Week and Format Indicator */}
        <WeekFormatIndicator metadata={metadata} isLoading={isLoading} />

        {/* Schedule Grid */}
        <ScheduleGrid lessons={filteredLessons} isLoading={isLoading} selectedGroup={filters.group} />
      </div>
    </div>
  );
}
