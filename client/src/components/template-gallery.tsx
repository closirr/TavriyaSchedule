import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  name: string;
  filename: string;
  description: string;
}

export default function TemplateGallery() {
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Ошибка загрузки шаблонов');
      return res.json();
    }
  });

  const downloadTemplate = async (filename: string, templateName: string) => {
    setDownloadingTemplate(filename);
    try {
      const response = await fetch(`/api/templates/${filename}`);
      if (!response.ok) {
        throw new Error('Ошибка скачивания шаблона');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Шаблон скачан",
        description: `${templateName} успешно скачан`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать шаблон",
        variant: "destructive"
      });
    } finally {
      setDownloadingTemplate(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка шаблонов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Выберите шаблон расписания</h2>
        <p className="text-gray-600">
          Скачайте и заполните удобный для вас формат Excel файла
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates?.map((template) => (
          <Card key={template.filename} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => downloadTemplate(template.filename, template.name)}
                disabled={downloadingTemplate === template.filename}
                className="w-full"
                variant="default"
              >
                {downloadingTemplate === template.filename ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Скачивание...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Скачать шаблон
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Инструкция по заполнению:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Скачайте один из шаблонов выше</li>
          <li>• Заполните данные согласно примерам в файле</li>
          <li>• Сохраните файл в формате .xlsx</li>
          <li>• Загрузите готовый файл через форму загрузки</li>
        </ul>
      </div>
    </div>
  );
}