import { useState, useRef } from "react";
import { FileSpreadsheet, Download, HelpCircle, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TemplateGallery from "./template-gallery";

export default function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-schedule', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка загрузки файла');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Успешно загружено",
        description: `Загружено ${data.lessonsCount} занятий`,
      });
      setUploadedFile(data.fileName || "schedule.xlsx");
      queryClient.invalidateQueries({ queryKey: ['/api/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/filter-options'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/template');
      if (!response.ok) throw new Error('Ошибка скачивания шаблона');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_schedule.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать шаблон",
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
        title: "Неверный формат файла",
        description: "Поддерживаются только файлы .xlsx и .xls",
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
            <h2 className="text-2xl font-semibold text-navy-700 mb-2">Управление расписанием</h2>
            <p className="text-gray-600">Скачайте шаблон, заполните его и загрузите обратно</p>
          </div>
          
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Шаблоны Excel</TabsTrigger>
              <TabsTrigger value="upload">Загрузка файла</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="mt-6">
              <TemplateGallery />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Загрузка заполненного файла</h3>
                    <p className="text-sm text-gray-600">Загрузите Excel файл с расписанием занятий</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Старый шаблон
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
                    {uploadMutation.isPending ? 'Загружается...' : 'Перетащите Excel файл сюда'}
                  </h3>
                  <p className="text-gray-500 mb-4">или нажмите для выбора файла</p>
                  <p className="text-sm text-gray-400">Поддерживаются форматы: .xlsx, .xls (макс. 10 МБ)</p>
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
                        <p className="font-medium text-green-800">Файл успешно загружен</p>
                        <p className="text-sm text-green-600">{uploadedFile} • Обновлено только что</p>
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
