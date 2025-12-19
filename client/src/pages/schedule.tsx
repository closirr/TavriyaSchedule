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
  } = useScheduleData();
  const { toast } = useToast();

  const handlePrint = () => {
    // Завжди друкуємо ВСІ уроки (всі групи по 4 в рядку)
    if (lessons.length === 0) {
      toast({
        title: "Помилка",
        description: "Немає даних для друку",
        variant: "destructive",
      });
      return;
    }

    const printerData = convertLessonsToPrinterFormat(
      lessons,
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
        />

        {/* Schedule Grid */}
        <ScheduleGrid lessons={filteredLessons} isLoading={isLoading} selectedGroup={filters.group} />
      </div>
    </div>
  );
}
