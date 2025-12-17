import { GraduationCap } from "lucide-react";
import ScheduleFilters from "@/components/schedule-filters";
import ScheduleGrid from "@/components/schedule-grid";
import { useScheduleData } from "@/hooks/useScheduleData";

export default function Schedule() {
  const {
    filteredLessons,
    filters,
    setFilters,
    filterOptions,
    isLoading,
  } = useScheduleData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-navy-700">Таврійський Коледж</h1>
                <p className="text-sm text-gray-500">Розклад занять</p>
              </div>
            </div>
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
