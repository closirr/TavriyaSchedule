import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WeekNavigation() {
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
    };
    
    return {
      weekNumber,
      dateRange: `${formatDate(monday)} - ${formatDate(sunday)}`
    };
  };

  const weekInfo = getCurrentWeekInfo();

  return (
    <div className="mb-8">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-navy-700">Розклад занять</h2>
              <span className="px-3 py-1 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
                Тиждень {weekInfo.weekNumber} • {weekInfo.dateRange}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-navy-600 hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-navy-600 bg-navy-50 hover:bg-navy-100 border-navy-200">
                Сьогодні
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-navy-600 hover:bg-gray-100">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
