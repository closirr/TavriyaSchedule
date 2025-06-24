import { useState } from "react";
import { GraduationCap, Bell, User } from "lucide-react";
import FileUpload from "@/components/file-upload";
import ScheduleFilters from "@/components/schedule-filters";
import WeekNavigation from "@/components/week-navigation";
import ScheduleGrid from "@/components/schedule-grid";
import StatisticsDashboard from "@/components/statistics-dashboard";
import { type ScheduleFilters as ScheduleFiltersType } from "@shared/schema";

export default function Schedule() {
  const [filters, setFilters] = useState<ScheduleFiltersType>({});
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white text-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-navy-700">Таврійський Коледж</h1>
                <p className="text-sm text-gray-500">Система управління розкладом</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-navy-600 transition-colors">
                <Bell className="text-lg" />
              </button>
              <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center">
                <User className="text-navy-600 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload */}
        <FileUpload />

        {/* Filters */}
        <ScheduleFilters onFiltersChange={setFilters} />

        {/* Week Navigation */}
        <WeekNavigation />

        {/* Schedule Grid */}
        <ScheduleGrid filters={filters} />

        {/* Statistics */}
        <StatisticsDashboard />
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
