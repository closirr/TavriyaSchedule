import { Calendar, Monitor, Building2 } from "lucide-react";
import type { ScheduleMetadata, WeekNumber } from "@/types/schedule";

interface WeekFormatIndicatorProps {
  metadata: ScheduleMetadata | null;
  currentWeek: WeekNumber;
  isWeekManual: boolean;
  isLoading?: boolean;
}

export default function WeekFormatIndicator({ metadata, currentWeek, isWeekManual, isLoading }: WeekFormatIndicatorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const format = metadata?.defaultFormat;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Week indicator */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-navy-50 dark:bg-navy-900/30 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-navy-600 dark:text-navy-400" />
        </div>
        <span className="text-sm font-medium text-navy-700 dark:text-navy-300 leading-snug">
          {currentWeek}-й тиждень
          {!isWeekManual && (
            <span className="text-xs text-gray-400 ml-1">(авто)</span>
          )}
        </span>
      </div>

      {/* Format indicator */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
          <span className="block sm:inline">Формат</span>{" "}
          <span className="block sm:inline">навчання:</span>
        </span>
        {format === 'онлайн' ? (
          <>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Monitor className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Онлайн</span>
          </>
        ) : format === 'офлайн' ? (
          <>
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Офлайн</span>
          </>
        ) : (
          <span className="text-sm text-gray-400">не вказано</span>
        )}
      </div>
    </div>
  );
}
