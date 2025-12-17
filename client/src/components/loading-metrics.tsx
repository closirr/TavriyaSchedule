import { useState, useEffect } from "react";
import { Clock, Database, Globe } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { config, devLog } from "@/lib/config";

// Hardcoded Google Sheets URL
const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1pl0PFC1jJ-75NUjiePCFvZuae8qpUQ4cBYxAfsi0ULQ/edit?usp=sharing";

interface LoadingMetrics {
  pageLoadTime: number;
  excelLoadTime: number | null;
  lessonsCount: number | null;
  status: 'loading' | 'success' | 'error';
  error?: string;
}

export default function LoadingMetricsDisplay() {
  const [metrics, setMetrics] = useState<LoadingMetrics>({
    pageLoadTime: 0,
    excelLoadTime: null,
    lessonsCount: null,
    status: 'loading'
  });
  const [pageStartTime] = useState(() => performance.now());
  const queryClient = useQueryClient();

  // Auto-load from Google Sheets on mount
  const { data, isLoading, error } = useQuery({
    queryKey: ['google-sheets-auto-load'],
    queryFn: async () => {
      const startTime = performance.now();
      
      const response = await fetch(`${config.apiBaseUrl}/api/load-google-sheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: GOOGLE_SHEETS_URL }),
      });

      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Помилка завантаження');
      }

      const result = await response.json();
      return { ...result, loadTime };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update metrics when data loads
  useEffect(() => {
    const pageLoadTime = Math.round(performance.now() - pageStartTime);
    
    if (isLoading) {
      setMetrics(prev => ({ ...prev, pageLoadTime, status: 'loading' }));
    } else if (error) {
      setMetrics({
        pageLoadTime,
        excelLoadTime: null,
        lessonsCount: null,
        status: 'error',
        error: (error as Error).message
      });
    } else if (data) {
      setMetrics({
        pageLoadTime,
        excelLoadTime: data.loadTime,
        lessonsCount: data.lessonsCount,
        status: 'success'
      });
      // Invalidate queries to refresh schedule data
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/filter-options'] });
    }
  }, [data, isLoading, error, pageStartTime, queryClient]);

  return (
    <div className="mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Метрика завантаження</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            metrics.status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            metrics.status === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {metrics.status === 'loading' ? 'Завантаження...' :
             metrics.status === 'success' ? 'Готово' : 'Помилка'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Page Load Time */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Сторінка</p>
              <p className="text-sm font-semibold text-gray-900">
                {metrics.pageLoadTime} мс
              </p>
            </div>
          </div>
          
          {/* Excel Load Time */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Google Sheets</p>
              <p className="text-sm font-semibold text-gray-900">
                {metrics.excelLoadTime !== null ? `${metrics.excelLoadTime} мс` : 
                 metrics.status === 'loading' ? '...' : '—'}
              </p>
            </div>
          </div>
          
          {/* Lessons Count */}
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Занять</p>
              <p className="text-sm font-semibold text-gray-900">
                {metrics.lessonsCount !== null ? metrics.lessonsCount : 
                 metrics.status === 'loading' ? '...' : '—'}
              </p>
            </div>
          </div>
        </div>
        
        {metrics.status === 'error' && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
            {metrics.error}
          </div>
        )}
      </div>
    </div>
  );
}
