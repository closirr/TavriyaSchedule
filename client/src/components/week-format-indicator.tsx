import { Calendar, Monitor, Building2 } from "lucide-react";
import type { ScheduleMetadata } from "@/types/schedule";

interface WeekFormatIndicatorProps {
  metadata: ScheduleMetadata | null;
  isLoading?: boolean;
}

export default function WeekFormatIndicator({ metadata, isLoading }: WeekFormatIndicatorProps) {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const weekNumber = metadata?.currentWeek;
  const format = metadata?.defaultFormat;

  // Don't render if no metadata
  if (!weekNumber && !format) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
      {/* Week indicator */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-navy-50 dark:bg-navy-900/30 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-navy-600 dark:text-navy-400" />
        </div>
        <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
          {weekNumber ? `${weekNumber}-й тиждень` : 'Тиждень не вказано'}
        </span>
      </div>

      {/* Format indicator */}
      <div className="flex items-center gap-2">
        {format === 'онлайн' ? (
          <>
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Онлайн</span>
          </>
        ) : format === 'офлайн' ? (
          <>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Офлайн</span>
          </>
        ) : (
          <span className="text-sm text-gray-400">Формат не вказано</span>
        )}
      </div>
    </div>
  );
}
