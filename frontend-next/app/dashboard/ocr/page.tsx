'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { useToast } from '../../../stores/ui-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Image, 
  Eye, 
  Copy, 
  Download, 
  Search, 
  TextIcon as Text, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

interface OCRResult {
  text: string;
  lines: string[];
  pages: Array<{
    page: number;
    text: string;
    text_blocks?: Array<{
      text: string;
      bbox: [number, number, number, number];
    }>;
    image_dimensions?: {
      width: number;
      height: number;
    };
  }>;
  filename: string;
  uploaded_by_user_id: string;
  created_at: string;
}

type ServiceStatus = 'checking' | 'ready' | 'ocr-only' | 'unavailable';

export default function OCRPage() {
  const { user, accessToken } = useAuthStore();
  
  
  // Simple auth fix function
  const fixAuth = () => {
    useAuthStore.getState().clearAuth();
    window.location.href = '/auth/login';
  };
  const toast = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');

  const checkServices = useCallback(async () => {
    try {
      // Try API Gateway first
      const gatewayResponse = await fetch('/api/health');
      if (gatewayResponse.ok) {
        setServiceStatus('ready');
        return;
      }
    } catch (e) {
      console.log('API Gateway not available');
    }

    try {
      // Try direct OCR service
      const ocrResponse = await fetch('http://localhost:8000/health');
      if (ocrResponse.ok) {
        setServiceStatus('ocr-only');
        return;
      }
    } catch (e) {
      console.log('OCR Service not available');
    }

    setServiceStatus('unavailable');
  }, []);

  useEffect(() => {
    checkServices();
  }, []); // Empty dependency - run once!

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Obsługiwane formaty: PDF, JPG, PNG');
        return;
      }
      
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Plik jest za duży. Maksymalny rozmiar: 50MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } } as any;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const processOCR = async () => {
    if (!file || !accessToken) {
      setError('Brak prawidłowego tokena uwierzytelnienia. Kliknij "Napraw uwierzytelnienie" powyżej.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    setLoadingMessage('Przygotowywanie pliku...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Starting OCR request...', { fileName: file.name, fileSize: file.size });
      
      // Simulate progress steps
      const progressSteps = [
        { progress: 10, message: 'Przesyłanie pliku...' },
        { progress: 30, message: 'Analizowanie dokumentu...' },
        { progress: 50, message: 'Rozpoznawanie tekstu...' },
        { progress: 70, message: 'Przetwarzanie wyników...' },
        { progress: 90, message: 'Finalizowanie...' },
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setLoadingProgress(progressSteps[currentStep].progress);
          setLoadingMessage(progressSteps[currentStep].message);
          currentStep++;
        }
      }, 800);
      
      const ocrUrl = '/api/ocr';  // Route through API Gateway to OCR service
      console.log('About to make OCR request:', { url: ocrUrl, fileName: file.name, tokenLength: accessToken?.length });
      
      const response = await fetch(ocrUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage('Ukończono!');

      console.log('OCR response received:', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Błąd podczas przetwarzania OCR';
        
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('OCR Result:', data);
      setResult(data);
      setSelectedTab('full-text');
      toast.success('OCR zakończone pomyślnie!');
    } catch (err: any) {
      console.error('OCR Error caught:', err);
      console.error('Error details:', { message: err.message, stack: err.stack, name: err.name });
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Serwis OCR nie jest dostępny. Sprawdź czy API Gateway i OCR Service są uruchomione.');
      } else {
        setError(err.message);
      }
      toast.error('Błąd OCR', err.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }, 500);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano do schowka!');
  };

  const downloadText = () => {
    if (!result) return;
    
    const blob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_result_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Plik został pobrany!');
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-8 w-8" />;
    return file.type === 'application/pdf' ? <FileText className="h-8 w-8" /> : <Image className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredLines = result?.lines?.filter(line =>
    line.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-bold">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Text className="h-8 w-8" />
          Przetwarzanie OCR
        </h1>
        <p className="text-muted-foreground mt-2">
          Konwertuj dokumenty PDF i obrazy na tekst za pomocą technologii OCR
        </p>
        {(!accessToken || accessToken === 'undefined' || accessToken === 'null') && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Brak prawidłowego tokena uwierzytelnienia.</p>
                  <p className="text-xs">Debug: accessToken = {accessToken || 'null'}</p>
                  <Button variant="outline" size="sm" onClick={fixAuth} className="ml-0">
                    🔧 Wyczyść i napraw uwierzytelnienie
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1. Wybierz plik do analizy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Status */}
          {serviceStatus === 'checking' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Sprawdzanie dostępności serwisów OCR...
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'unavailable' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">🚧 Serwis OCR nie jest dostępny</p>
                  <p className="text-sm">
                    OCR Service się buduje (PaddleOCR dependencies ~2-5 min). 
                    Sprawdź status: <code className="bg-muted px-1 rounded">docker-compose logs ocr-service</code>
                  </p>
                  <p className="text-sm">
                    Po zbudowaniu uruchom: <code className="bg-muted px-1 rounded">docker-compose up -d ocr-service api-gateway</code>
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setServiceStatus('checking');
                      setTimeout(() => {
                        checkServices();
                      }, 100);
                    }}
                  >
                    🔄 Sprawdź ponownie
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'ocr-only' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                API Gateway niedostępny. Używa bezpośredniego połączenia z OCR Service.
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'ready' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Serwisy OCR są gotowe do użycia!
              </AlertDescription>
            </Alert>
          )}

          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${file 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5'
              }
            `}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-4">
              {getFileIcon()}
              
              {file ? (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-700">
                    {file.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Przeciągnij plik tutaj lub kliknij, aby wybrać
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Obsługiwane formaty: PDF, JPG, PNG (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={processOCR}
              disabled={!file || loading || !accessToken || accessToken === 'undefined' || accessToken === 'null'}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                    <span className="font-medium">{loadingMessage}</span>
                  </div>
                  <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                    <div 
                      className="bg-primary-foreground h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-primary-foreground/80">{loadingProgress}%</span>
                </div>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analizuj OCR
                </>
              )}
            </Button>
            
            {file && (
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError(null);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Wyczyść
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Wyniki analizy OCR</CardTitle>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.text)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadText}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {result.pages?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Stron</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {result.lines?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Linii tekstu</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {result.text?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Znaków</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                  <div className="text-sm text-muted-foreground">
                    {new Date(result.created_at).toLocaleString('pl-PL')}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="full-text" className="flex items-center gap-2">
                  <Text className="h-4 w-4" />
                  Pełny tekst
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Strony
                </TabsTrigger>
                <TabsTrigger value="lines" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Linie
                </TabsTrigger>
              </TabsList>

              <TabsContent value="full-text" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cały tekst z dokumentu</h3>
                  <Textarea
                    value={result.text}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="pages" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tekst podzielony na strony</h3>
                  <div className="space-y-4">
                    {result.pages?.map((page, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Strona {page.page} ({page.text?.length || 0} znaków)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            value={page.text}
                            readOnly
                            className="min-h-[200px] font-mono text-sm"
                          />
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(page.text)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Kopiuj stronę
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lines" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      Lista linii tekstu ({filteredLines.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Szukaj w liniach..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-auto">
                        {filteredLines.map((line, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                            <Badge variant="outline" className="min-w-[3rem] justify-center">
                              {index + 1}
                            </Badge>
                            <div className="flex-1 font-mono text-sm">
                              {highlightText(line, searchTerm)}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(line)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Debug Info */}
            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              Plik: {result.filename} | 
              Przetworzony przez: {result.uploaded_by_user_id} | 
              Data: {new Date(result.created_at).toLocaleString('pl-PL')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}