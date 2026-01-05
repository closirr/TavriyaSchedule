import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Lesson } from '@/types/schedule';

interface ExportButtonsProps {
  lessons: Lesson[];
}

/**
 * Generates a simple HTML table for the schedule
 */
function generateScheduleHTML(lessons: Lesson[]): string {
  const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayNames: Record<string, string> = {
    'Понедельник': 'Понеділок',
    'Вторник': 'Вівторок',
    'Среда': 'Середа',
    'Четверг': 'Четвер',
    'Пятница': "П'ятниця",
    'Суббота': 'Субота',
  };

  // Group lessons by day
  const byDay: Record<string, Lesson[]> = {};
  for (const day of dayOrder) {
    byDay[day] = lessons
      .filter(l => l.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  let html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Розклад занять - ВСП «КФКМГ ТНУ ім.В.І.Вернадського»</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1e3a5f; text-align: center; }
    h2 { color: #2d4a6f; margin-top: 30px; border-bottom: 2px solid #1e3a5f; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #1e3a5f; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .no-lessons { color: #888; font-style: italic; }
    .time { font-weight: bold; color: #1e3a5f; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Розклад занять - ВСП «КФКМГ ТНУ ім.В.І.Вернадського»</h1>
  <p style="text-align: center; color: #666;">Згенеровано: ${new Date().toLocaleDateString('uk-UA')}</p>
`;

  for (const day of dayOrder) {
    const dayLessons = byDay[day];
    html += `  <h2>${dayNames[day]}</h2>\n`;
    
    if (dayLessons.length === 0) {
      html += `  <p class="no-lessons">Занять немає</p>\n`;
    } else {
      html += `  <table>
    <thead>
      <tr>
        <th>Час</th>
        <th>Предмет</th>
        <th>Викладач</th>
        <th>Група</th>
        <th>Аудиторія</th>
      </tr>
    </thead>
    <tbody>\n`;
      
      for (const lesson of dayLessons) {
        html += `      <tr>
        <td class="time">${lesson.startTime} - ${lesson.endTime}</td>
        <td>${lesson.subject}</td>
        <td>${lesson.teacher}</td>
        <td>${lesson.group}</td>
        <td>${lesson.classroom}</td>
      </tr>\n`;
      }
      
      html += `    </tbody>
  </table>\n`;
    }
  }

  html += `</body>
</html>`;

  return html;
}

/**
 * Generates CSV content from lessons
 */
function generateScheduleCSV(lessons: Lesson[]): string {
  const headers = ['День тижня', 'Час початку', 'Час закінчення', 'Предмет', 'Викладач', 'Група', 'Аудиторія'];
  const dayNames: Record<string, string> = {
    'Понедельник': 'Понеділок',
    'Вторник': 'Вівторок',
    'Среда': 'Середа',
    'Четверг': 'Четвер',
    'Пятница': "П'ятниця",
    'Суббота': 'Субота',
  };

  const rows = lessons.map(lesson => [
    dayNames[lesson.dayOfWeek] || lesson.dayOfWeek,
    lesson.startTime,
    lesson.endTime,
    lesson.subject,
    lesson.teacher,
    lesson.group,
    lesson.classroom,
  ].map(field => `"${field.replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export default function ExportButtons({ lessons }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'html' | 'csv') => {
    if (lessons.length === 0) {
      toast({
        title: "Помилка",
        description: "Немає даних для експорту",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'html') {
        content = generateScheduleHTML(lessons);
        mimeType = 'text/html;charset=utf-8';
        extension = 'html';
      } else {
        content = generateScheduleCSV(lessons);
        mimeType = 'text/csv;charset=utf-8';
        extension = 'csv';
      }

      const blob = new Blob(['\ufeff' + content], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `rozklad-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Успіх",
        description: `${format.toUpperCase()} файл успішно завантажено`,
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
    <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Експорт розкладу:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleExport('html')}
            disabled={isExporting || lessons.length === 0}
            className="flex items-center gap-2"
            variant="default"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            HTML
          </Button>
          
          <Button
            onClick={() => handleExport('csv')}
            disabled={isExporting || lessons.length === 0}
            className="flex items-center gap-2"
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            CSV
          </Button>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>HTML файл можна відкрити в браузері та роздрукувати. CSV можна відкрити в Excel.</span>
      </div>
    </div>
  );
}
