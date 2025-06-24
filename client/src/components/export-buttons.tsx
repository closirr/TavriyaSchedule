import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function ExportButtons() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const { toast } = useToast();

  const { data: filterOptions } = useQuery({
    queryKey: ['/api/filter-options'],
    staleTime: Infinity
  });

  const handleExportPDF = async (group?: string) => {
    setIsExporting(true);
    try {
      const url = group ? `/api/export/pdf/${encodeURIComponent(group)}` : '/api/export/pdf';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Помилка експорту');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const filename = group 
        ? `rozklad-${group}-${new Date().toISOString().split('T')[0]}.pdf`
        : `rozklad-${new Date().toISOString().split('T')[0]}.pdf`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Успіх",
        description: "PDF файл успішно завантажено",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося експортувати розклад",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Експорт розкладу:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Export full schedule */}
          <Button
            onClick={() => handleExportPDF()}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Повний розклад (PDF)
          </Button>
          
          {/* Export by group */}
          <div className="flex gap-2">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Виберіть групу" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.groups?.map((group: string) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => selectedGroup && handleExportPDF(selectedGroup)}
              disabled={isExporting || !selectedGroup}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF групи
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        PDF файл буде збережено у форматі, придатному для друку та розміщення на дошці оголошень
      </div>
    </div>
  );
}