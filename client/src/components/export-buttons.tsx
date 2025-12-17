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

  const handleExport = async (format: 'pdf' | 'pdf-cyrillic' | 'html' | 'rtf', group?: string) => {
    setIsExporting(true);
    try {
      const baseUrl = group ? `/api/export/${format}/${encodeURIComponent(group)}` : `/api/export/${format}`;
      const response = await fetch(baseUrl);
      
      if (!response.ok) {
        throw new Error('Помилка експорту');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const extensions = { pdf: 'pdf', 'pdf-cyrillic': 'pdf', html: 'html', rtf: 'rtf' };
      const filename = group 
        ? `rozklad-${group}-${new Date().toISOString().split('T')[0]}.${extensions[format]}`
        : `rozklad-${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      const formatNames = { 
        pdf: 'PDF (латиниця)', 
        'pdf-cyrillic': 'PDF (кириліца)', 
        html: 'HTML (кириліца)', 
        rtf: 'Word (кириліца)' 
      };
      toast({
        title: "Успіх",
        description: `${formatNames[format]} файл успішно завантажено`,
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
        
        <div className="flex flex-col gap-4 flex-1">
          {/* Format selection buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleExport('pdf-cyrillic')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="default"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF (кириліца)
            </Button>
            
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF (латиниця)
            </Button>
            
            <Button
              onClick={() => handleExport('rtf')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Word (кириліца)
            </Button>
            
            <Button
              onClick={() => handleExport('html')}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              HTML
            </Button>
          </div>
          
          {/* Export by group */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Для групи:</span>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-40">
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
              onClick={() => selectedGroup && handleExport('pdf-cyrillic', selectedGroup)}
              disabled={isExporting || !selectedGroup}
              variant="secondary"
              size="sm"
            >
              PDF (кир)
            </Button>
            
            <Button
              onClick={() => selectedGroup && handleExport('pdf', selectedGroup)}
              disabled={isExporting || !selectedGroup}
              variant="secondary"
              size="sm"
            >
              PDF (лат)
            </Button>
            
            <Button
              onClick={() => selectedGroup && handleExport('rtf', selectedGroup)}
              disabled={isExporting || !selectedGroup}
              variant="secondary"
              size="sm"
            >
              Word
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        <div>• PDF (кириліца) - повноцінний PDF з українським текстом</div>
        <div>• PDF (латиниця) - резервний варіант з транслітерацією</div>
        <div>• Word (кириліца) - для редагування в Microsoft Word</div>
      </div>
    </div>
  );
}