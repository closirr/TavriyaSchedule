import { GraduationCap } from "lucide-react";
import ScheduleFilters from "@/components/schedule-filters";
import ScheduleGrid from "@/components/schedule-grid";
import StatisticsDashboard from "@/components/statistics-dashboard";
import { useScheduleData } from "@/hooks/useScheduleData";

export default function Schedule() {
  const {
    filteredLessons,
    filters,
    setFilters,
    filterOptions,
    statistics,
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

        {/* Statistics */}
        <StatisticsDashboard statistics={statistics} isLoading={isLoading} />
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white text-sm" />
                </div>
                <span className="font-semibold text-navy-700">Таврійський Коледж</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Сучасна система управління розкладом для освітніх закладів</p>
            </div>
            <div>
              <h4 className="font-semibold text-navy-700 mb-4">Функції</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Завантаження розкладу</li>
                <li>Пошук та фільтрація</li>
                <li>Мобільна версія</li>
                <li>Сповіщення</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy-700 mb-4">Підтримка</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Інструкція з використання</li>
                <li>Технічна підтримка</li>
                <li>Повідомити про помилку</li>
                <li>Зворотний зв'язок</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 flex items-center justify-between">
            <p className="text-sm text-gray-500">© 2024 Таврійський Коледж. Усі права захищені.</p>
            <p className="text-sm text-gray-500">Версія 1.0.2 • Оновлено 20.03.2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
