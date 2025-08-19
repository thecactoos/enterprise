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
  X,
  Brain,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';

interface IntelligentOCRResult {
  text: string;
  lines: string[];
  pages: Array<{
    page: number;
    text: string;
    text_blocks?: Array<{
      text: string;
      bbox: [number, number, number, number];
      confidence?: number;
    }>;
    image_dimensions?: {
      width: number;
      height: number;
    };
  }>;
  filename: string;
  uploaded_by_user_id: string;
  created_at: string;
  // Intelligent features
  entities?: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'email' | 'phone';
    confidence: number;
  }>;
  summary?: string;
  language?: string;
  document_type?: string;
  key_information?: Record<string, any>;
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  action_items?: string[];
}

type ServiceStatus = 'checking' | 'ready' | 'ocr-only' | 'unavailable';

export default function IntelligentOCRPage() {
  const { user, accessToken } = useAuthStore();
  const toast = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntelligentOCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');
  const [intelligentMode, setIntelligentMode] = useState(true);

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
  }, [checkServices]);

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

  const processIntelligentOCR = async () => {
    if (!file || !accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('intelligent_mode', intelligentMode.toString());

      console.log('Starting Intelligent OCR request...', { fileName: file.name, fileSize: file.size, intelligentMode });
      
      const ocrUrl = `/api/ocr/intelligent?intelligent_mode=${intelligentMode}`;
      console.log('Intelligent OCR URL:', ocrUrl);
      
      const response = await fetch(ocrUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      console.log('Intelligent OCR response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Błąd podczas przetwarzania Intelligent OCR';
        
        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Intelligent OCR Result:', data);
      setResult(data);
      setSelectedTab('intelligent-analysis');
      toast.success('Intelligent OCR zakończone pomyślnie!');
    } catch (err: any) {
      console.error('Intelligent OCR Error:', err);
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Serwis Intelligent OCR nie jest dostępny. Sprawdź czy API Gateway i OCR Service są uruchomione.');
      } else {
        setError(err.message);
      }
      toast.error('Błąd Intelligent OCR', err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano do schowka!');
  };

  const downloadText = () => {
    if (!result) return;
    
    const analysisData = {
      text: result.text,
      entities: result.entities,
      summary: result.summary,
      language: result.language,
      document_type: result.document_type,
      key_information: result.key_information
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligent_ocr_result_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analiza została pobrana!');
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

  const getEntityColor = (type: string) => {
    const colors = {
      person: 'bg-blue-100 text-blue-800',
      organization: 'bg-green-100 text-green-800',
      location: 'bg-purple-100 text-purple-800',
      date: 'bg-orange-100 text-orange-800',
      money: 'bg-yellow-100 text-yellow-800',
      email: 'bg-pink-100 text-pink-800',
      phone: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Brain className="h-8 w-8 text-primary" />
            <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Intelligent OCR
          </h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            AI-Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Zaawansowane przetwarzanie dokumentów z AI - ekstrakcja tekstu, rozpoznawanie encji, analiza zawartości
        </p>
      </div>

      {/* Features Banner */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Rozpoznawanie Encji</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Automatyczne Streszczenie</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Analiza Struktury</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            1. Wybierz dokument do inteligentnej analizy
          </CardTitle>
          <CardDescription>
            Załaduj plik PDF lub obraz, aby rozpocząć zaawansowaną analizę AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Service Status */}
          {serviceStatus === 'checking' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Sprawdzanie dostępności serwisów Intelligent OCR...
              </AlertDescription>
            </Alert>
          )}
          
          {serviceStatus === 'unavailable' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">🚧 Serwis Intelligent OCR nie jest dostępny</p>
                  <p className="text-sm">
                    OCR Service się buduje (PaddleOCR + AI dependencies ~3-7 min). 
                    Sprawdź status: <code className="bg-muted px-1 rounded">docker-compose logs ocr-service</code>
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
          
          {serviceStatus === 'ready' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🚀 Serwisy Intelligent OCR są gotowe do użycia!
              </AlertDescription>
            </Alert>
          )}

          {/* Intelligent Mode Toggle - ENHANCED VISIBILITY */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg shadow-md">
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2 text-blue-800">
                <Brain className="h-6 w-6 text-blue-600" />
                🤖 Tryb Inteligentny AI
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Włącz AI do analizy encji, streszczenia i struktury dokumentu
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                variant={intelligentMode ? "default" : "outline"}
                onClick={() => setIntelligentMode(!intelligentMode)}
                size="lg"
                className={intelligentMode 
                  ? "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold px-6 py-3 text-lg shadow-lg" 
                  : "border-2 border-red-400 text-red-600 hover:bg-red-50 font-bold px-6 py-3 text-lg"
                }
              >
                {intelligentMode ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    ✅ WŁĄCZONY
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-5 w-5" />
                    ❌ WYŁĄCZONY
                  </>
                )}
              </Button>
              <span className="text-xs text-gray-600 text-center">
                {intelligentMode ? "Analiza OpenAI aktywna" : "Tylko podstawowy OCR"}
              </span>
            </div>
          </div>

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
                    Przeciągnij dokument tutaj lub kliknij, aby wybrać
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
              onClick={processIntelligentOCR}
              disabled={!file || loading}
              size="lg"
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizowanie AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Rozpocznij Intelligent OCR
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
                <CardTitle>Wyniki Intelligent OCR</CardTitle>
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  AI Processed
                </Badge>
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
            {/* Enhanced Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                    {result.entities?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Encji</div>
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
                  <div className="text-sm font-semibold text-primary">
                    {result.language || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Język</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-semibold text-primary">
                    {result.document_type || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Typ dok.</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="intelligent-analysis" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Analiza AI
                </TabsTrigger>
                <TabsTrigger value="openai-output" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  OpenAI
                </TabsTrigger>
                <TabsTrigger value="full-text" className="flex items-center gap-2">
                  <Text className="h-4 w-4" />
                  Tekst
                </TabsTrigger>
                <TabsTrigger value="entities" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Encje
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Strony
                </TabsTrigger>
              </TabsList>

              <TabsContent value="intelligent-analysis" className="mt-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Inteligentna Analiza Dokumentu
                  </h3>
                  
                  {result.summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📋 Automatyczne Streszczenie</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{result.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {result.key_information && Object.keys(result.key_information).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🔍 Kluczowe Informacje</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(result.key_information).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium text-sm">{key}:</span>
                              <span className="text-sm">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🌍 Język Dokumentu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-lg">
                          {result.language || 'Nierozpoznany'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📄 Typ Dokumentu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-lg">
                          {result.document_type || 'Nierozpoznany'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="openai-output" className="mt-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Kompletna Analiza OpenAI
                  </h3>
                  
                  {/* Topics */}
                  {result.topics && result.topics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🏷️ Tematy i Kategorie</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {result.topics.map((topic, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Sentiment Analysis */}
                  {result.sentiment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🎭 Analiza Sentymentu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge 
                          variant="outline" 
                          className={`text-lg ${
                            result.sentiment === 'positive' ? 'border-green-500 text-green-700 bg-green-50' :
                            result.sentiment === 'negative' ? 'border-red-500 text-red-700 bg-red-50' :
                            'border-gray-500 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {result.sentiment === 'positive' ? '😊 Pozytywny' :
                           result.sentiment === 'negative' ? '😞 Negatywny' :
                           '😐 Neutralny'}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Items */}
                  {result.action_items && result.action_items.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">✅ Zalecane Działania</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.action_items.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Raw OpenAI JSON Output */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🤖 Surowe Dane OpenAI (JSON)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify({
                            summary: result.summary,
                            entities: result.entities,
                            keyInformation: result.key_information,
                            documentType: result.document_type,
                            language: result.language,
                            sentiment: result.sentiment,
                            topics: result.topics,
                            actionItems: result.action_items
                          }, null, 2)}
                        </pre>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify({
                            summary: result.summary,
                            entities: result.entities,
                            keyInformation: result.key_information,
                            documentType: result.document_type,
                            language: result.language,
                            sentiment: result.sentiment,
                            topics: result.topics,
                            actionItems: result.action_items
                          }, null, 2))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Skopiuj JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const aiData = {
                              summary: result.summary,
                              entities: result.entities,
                              keyInformation: result.key_information,
                              documentType: result.document_type,
                              language: result.language,
                              sentiment: result.sentiment,
                              topics: result.topics,
                              actionItems: result.action_items
                            };
                            const blob = new Blob([JSON.stringify(aiData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `openai_analysis_${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Pobierz JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="entities" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Rozpoznane Encje ({result.entities?.length || 0})
                  </h3>
                  
                  {result.entities && result.entities.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(
                        result.entities.reduce((acc, entity) => {
                          if (!acc[entity.type]) acc[entity.type] = [];
                          acc[entity.type].push(entity);
                          return acc;
                        }, {} as Record<string, typeof result.entities>)
                      ).map(([type, entities]) => (
                        <Card key={type}>
                          <CardHeader>
                            <CardTitle className="text-base capitalize">
                              {type} ({entities.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {entities.map((entity, index) => (
                                <Badge 
                                  key={index} 
                                  className={getEntityColor(entity.type)}
                                  title={`Pewność: ${(entity.confidence * 100).toFixed(1)}%`}
                                >
                                  {entity.text}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nie znaleziono rozpoznawalnych encji w dokumencie.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="full-text" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pełny tekst z dokumentu</h3>
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
            </Tabs>

            {/* Debug Info */}
            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              Plik: {result.filename} | 
              Przetworzony przez: {result.uploaded_by_user_id} | 
              Data: {new Date(result.created_at).toLocaleString('pl-PL')} |
              Tryb: {intelligentMode ? 'Intelligent AI' : 'Standard OCR'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
