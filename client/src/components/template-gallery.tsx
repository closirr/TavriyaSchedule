import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { config, devLog } from '@/lib/config';

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
      const url = `${config.apiBaseUrl}/api/templates`;
      devLog('Fetching templates from:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Помилка завантаження шаблонів');
      return res.json();
    }
  });

  const downloadTemplate = async (filename: string, templateName: string) => {
    setDownloadingTemplate(filename);
    try {
      const apiUrl = `${config.apiBaseUrl}/api/templates/${filename}`;
      devLog('Downloading template from:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Помилка завантаження шаблону');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Шаблон завантажено",
        description: `${templateName} успішно завантажено`
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити шаблон",
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
        <span className="ml-2">Завантаження шаблонів...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Оберіть шаблон розкладу</h2>
        <p className="text-gray-600">
          Завантажте та заповніть зручний для вас формат Excel файлу
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
                    Завантаження...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Завантажити шаблон
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Інструкція з заповнення:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Завантажте один із шаблонів вище</li>
          <li>• Заповніть дані згідно з прикладами у файлі</li>
          <li>• Збережіть файл у форматі .xlsx</li>
          <li>• Завантажте готовий файл через форму завантаження</li>
        </ul>
      </div>
    </div>
  );
}