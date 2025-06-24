import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type ScheduleFilters } from "@shared/schema";

interface ScheduleFiltersProps {
  onFiltersChange: (filters: ScheduleFilters) => void;
}

export default function ScheduleFilters({ onFiltersChange }: ScheduleFiltersProps) {
  const [filters, setFilters] = useState<ScheduleFilters>({
    search: "",
    group: "",
    teacher: "",
    classroom: ""
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['/api/filter-options'],
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof ScheduleFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "__all__" ? "" : value
    }));
  };

  return (
    <div className="mb-8">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Пошук</Label>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Пошук за предметом, викладачем..." 
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Група</Label>
              <Select value={filters.group || "__all__"} onValueChange={(value) => handleFilterChange('group', value)}>
                <SelectTrigger className="focus:ring-2 focus:ring-navy-500 focus:border-navy-500">
                  <SelectValue placeholder="Всі групи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Всі групи</SelectItem>
                  {filterOptions?.groups?.map((group: string) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Викладач</Label>
              <Select value={filters.teacher || "__all__"} onValueChange={(value) => handleFilterChange('teacher', value)}>
                <SelectTrigger className="focus:ring-2 focus:ring-navy-500 focus:border-navy-500">
                  <SelectValue placeholder="Всі викладачі" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Всі викладачі</SelectItem>
                  {filterOptions?.teachers?.map((teacher: string) => (
                    <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2">Аудиторія</Label>
              <Select value={filters.classroom || "__all__"} onValueChange={(value) => handleFilterChange('classroom', value)}>
                <SelectTrigger className="focus:ring-2 focus:ring-navy-500 focus:border-navy-500">
                  <SelectValue placeholder="Всі аудиторії" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Всі аудиторії</SelectItem>
                  {filterOptions?.classrooms?.map((classroom: string) => (
                    <SelectItem key={classroom} value={classroom}>{classroom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
