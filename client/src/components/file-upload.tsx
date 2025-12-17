import { useState, useRef } from "react";
import { FileSpreadsheet, Download, HelpCircle, CheckCircle2, Upload, Link, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { config, devLog } from "@/lib/config";
import TemplateGallery from "./template-gallery";

export default function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = `${config.apiBaseUrl}/api/upload-schedule`;
      devLog('Uploading file to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Помилка завантаження файлу');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Успішно завантажено",
        description: `Завантажено ${data.lessonsCount} занять`,
      });
      setUploadedFile(data.fileName || "schedule.xlsx");
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/filter-options'] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка завантаження",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const googleSheetsMutation = useMutation({
    mutationFn: async (sheetUrl: string) => {
      const url = `${config.apiBaseUrl}/api/load-google-sheets`;
      devLog('Loading from Google Sheets:', sheetUrl);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Помилка завантаження з Google Sheets');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Успішно завантажено",
        description: `Завантажено ${data.lessonsCount} занять з Google Sheets`,
      });
      setUploadedFile("Google Sheets");
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/filter-options'] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка завантаження",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGoogleSheetsLoad = () => {
    if (!googleSheetsUrl.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть посилання на Google Sheets",
        variant: "destructive",
      });
      return;
    }
    googleSheetsMutation.mutate(googleSheetsUrl);
  };

  const downloadTemplate = async () => {
    try {
      const apiUrl = `${config.apiBaseUrl}/api/template`;
      devLog('Downloading template from:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Помилка завантаження шаблону');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'template_schedule.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити шаблон",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: "Невірний формат файлу",
        description: "Підтримуються тільки файли .xlsx та .xls",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-8">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-navy-700 mb-2">Управління розкладом</h2>
            <p className="text-gray-600">Завантажте шаблон, заповніть його та завантажте назад</p>
          </div>
          
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Шаблони Excel</TabsTrigger>
              <TabsTrigger value="upload">Завантаження файлу</TabsTrigger>
              <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="mt-6">
              <TemplateGallery />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Завантаження заповненого файлу</h3>
                    <p className="text-sm text-gray-600">Завантажте Excel файл з розкладом занять</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Старий шаблон
                  </Button>
                </div>
                
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver ? 'border-navy-500 bg-navy-50' : 'border-gray-300 hover:border-navy-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleUploadAreaClick}
                >
                  <div className="mx-auto w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-4">
                    {uploadMutation.isPending ? (
                      <Upload className="text-2xl text-navy-600 animate-bounce" />
                    ) : (
                      <FileSpreadsheet className="text-2xl text-navy-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-navy-700 mb-2">
                    {uploadMutation.isPending ? 'Завантажується...' : 'Перетягніть Excel файл сюди'}
                  </h3>
                  <p className="text-gray-500 mb-4">або натисніть для вибору файлу</p>
                  <p className="text-sm text-gray-400">Підтримуються формати: .xlsx, .xls (макс. 10 МБ)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                  />
                </div>

                {/* Upload Status */}
                {uploadedFile && !uploadMutation.isPending && (
                  <div className="mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <CheckCircle2 className="text-green-600 text-lg mr-3" />
                      <div>
                        <p className="font-medium text-green-800">Файл успішно завантажено</p>
                        <p className="text-sm text-green-600">{uploadedFile} • Оновлено щойно</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="google-sheets" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Завантаження з Google Sheets</h3>
                  <p className="text-sm text-gray-600">Завантажте розклад напряму з публічної Google таблиці</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Як це працює:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Відкрийте вашу Google таблицю</li>
                        <li>Файл → Поділитися → Опублікувати в інтернеті</li>
                        <li>Скопіюйте посилання та вставте нижче</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      onClick={handleGoogleSheetsLoad}
                      disabled={googleSheetsMutation.isPending}
                      className="bg-navy-600 hover:bg-navy-700"
                    >
                      {googleSheetsMutation.isPending ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Завантаження...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4 mr-2" />
                          Завантажити
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Таблиця повинна бути опублікована публічно. Формат даних такий самий як у шаблонах Excel.
                  </p>
                </div>

                {/* Success Status */}
                {uploadedFile === "Google Sheets" && !googleSheetsMutation.isPending && (
                  <div className="mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <CheckCircle2 className="text-green-600 text-lg mr-3" />
                      <div>
                        <p className="font-medium text-green-800">Дані успішно завантажено</p>
                        <p className="text-sm text-green-600">З Google Sheets • Оновлено щойно</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
