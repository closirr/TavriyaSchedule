import { Clock, Database, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingMetricsDisplayProps {
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  lessonsCount: number;
  error: string | null;
}

export default function LoadingMetricsDisplay({
  isLoading,
  isRefreshing,
  lastUpdated,
  onRefresh,
  lessonsCount,
  error,
}: LoadingMetricsDisplayProps) {
  const status = error ? 'error' : isLoading ? 'loading' : 'success';
  
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return '—';
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Метрика завантаження</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
              status === 'success' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status === 'loading' ? 'Завантаження...' :
               status === 'success' ? 'Готово' : 'Помилка'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              className="h-7 px-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-1 text-xs">Оновити</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Last Updated */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Оновлено</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Статус</p>
              <p className="text-sm font-semibold text-gray-900">
                {isLoading ? 'Завантаження...' : isRefreshing ? 'Оновлення...' : 'Готово'}
              </p>
            </div>
          </div>
          
          {/* Lessons Count */}
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Занять</p>
              <p className="text-sm font-semibold text-gray-900">
                {isLoading ? '...' : lessonsCount}
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
