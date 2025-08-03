import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as PdfIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  FileCopy as CopyIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  TextSnippet as TextIcon,
  DataArray as LinesIcon,
  Schedule as TimeIcon,
  Person as UserIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/environment';

// Lazy import for OCRImageViewer to avoid hot reload issues
const OCRImageViewer = React.lazy(() => import('./OCRImageViewer'));

const OCRProcessor = () => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTextBlock, setSelectedTextBlock] = useState(null);
  const [expandedPage, setExpandedPage] = useState(null);
  const [serviceStatus, setServiceStatus] = useState('checking');

  const checkServices = React.useCallback(async () => {
    try {
      // Try API Gateway first
      const gatewayResponse = await fetch(`${config.api.baseURL}/health`);
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

  // Check service status on component mount
  React.useEffect(() => {
    checkServices();
  }, [checkServices]);

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0];
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

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const processOCR = async () => {
    if (!file || !token) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Starting OCR request...', { fileName: file.name, fileSize: file.size });
      
      // Use API Gateway for OCR requests
      const ocrUrl = `${config.api.baseURL}/api/ocr`;
      console.log('OCR URL:', ocrUrl);
      
      const response = await fetch(ocrUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('OCR response status:', response.status);

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
      console.log('OCR Result with text_blocks:', data);
      console.log('Pages data:', data.pages);
      console.log('First page text_blocks:', data.pages?.[0]?.text_blocks);
      setResult(data);
      setSelectedTab(0);
    } catch (err) {
      console.error('OCR Error:', err);
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Serwis OCR nie jest dostępny. Sprawdź czy API Gateway i OCR Service są uruchomione.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
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
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon />;
    return file.type === 'application/pdf' ? <PdfIcon /> : <ImageIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredLines = result?.lines?.filter(line =>
    line.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <TextIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Przetwarzanie OCR
      </Typography>

      {/* File Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Service Status */}
        {serviceStatus === 'checking' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Sprawdzanie dostępności serwisów OCR...
            </Box>
          </Alert>
        )}
        
        {serviceStatus === 'unavailable' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                🚧 <strong>Serwis OCR nie jest dostępny</strong>
              </Typography>
              <Typography variant="caption" display="block">
                OCR Service się buduje (PaddleOCR dependencies ~2-5 min). 
                Sprawdź status: <code>docker-compose logs ocr-service</code>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Po zbudowaniu uruchom: <code>docker-compose up -d ocr-service api-gateway</code>
              </Typography>
              <Button 
                size="small" 
                variant="outlined" 
                sx={{ mt: 1 }}
                onClick={() => {
                  setServiceStatus('checking');
                  // Trigger useEffect by changing state
                  setTimeout(() => {
                    // Re-run service check
                    checkServices();
                  }, 100);
                }}
              >
                🔄 Sprawdź ponownie
              </Button>
            </Box>
          </Alert>
        )}
        
        {serviceStatus === 'ocr-only' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            API Gateway niedostępny. Używa bezpośredniego połączenia z OCR Service.
          </Alert>
        )}
        
        {serviceStatus === 'ready' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <SuccessIcon sx={{ mr: 1 }} />
            Serwisy OCR są gotowe do użycia!
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          1. Wybierz plik do analizy
        </Typography>
        
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            border: '2px dashed',
            borderColor: file ? 'success.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: file ? 'success.50' : 'grey.50',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50'
            }
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {getFileIcon()}
            
            {file ? (
              <Box>
                <Typography variant="h6" color="success.main">
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(file.size)} • {file.type}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Przeciągnij plik tutaj lub kliknij, aby wybrać
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Obsługiwane formaty: PDF, JPG, PNG (max 50MB)
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={processOCR}
            disabled={!file || loading}
            size="large"
          >
            {loading ? 'Przetwarzanie...' : 'Analizuj OCR'}
          </Button>
          
          {file && (
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                setResult(null);
                setError(null);
              }}
            >
              Wyczyść
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Analizowanie dokumentu za pomocą OCR...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Results Section */}
      {result && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              <SuccessIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
              Wyniki analizy OCR
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Kopiuj cały tekst">
                <IconButton onClick={() => copyToClipboard(result.text)}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pobierz jako plik tekstowy">
                <IconButton onClick={downloadText}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Metadata */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {result.pages?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stron
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {result.lines?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Linii tekstu
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {result.text?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Znaków
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimeIcon sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(result.created_at).toLocaleString('pl-PL')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for different views */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="Dokument z highlighted tekstem" icon={<ViewIcon />} />
              <Tab label="Połączony tekst" icon={<TextIcon />} />
              <Tab label="Podział na strony" icon={<ViewIcon />} />
              <Tab label="Lista linii" icon={<LinesIcon />} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Podgląd dokumentu z highlighted tekstem
              </Typography>
              {result.pages && result.pages[0] && result.pages[0].text_blocks ? (
                <React.Suspense fallback={<Typography>Ładowanie viewer-a...</Typography>}>
                  <OCRImageViewer
                    imageFile={file}
                    textBlocks={result.pages[0].text_blocks}
                    imageDimensions={result.pages[0].image_dimensions}
                    onTextBlockClick={(index, block) => {
                      setSelectedTextBlock(index);
                      console.log('Clicked text block:', block);
                    }}
                    selectedTextBlock={selectedTextBlock}
                  />
                </React.Suspense>
              ) : result.pages && result.pages[0] ? (
                <Box>
                  <Typography variant="body1" color="warning.main" gutterBottom>
                    ⚠️ Brak text_blocks z coordinates - używasz starej wersji OCR Service
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Uruchom ponownie OCR service z enhanced coordinate support
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1" color="error.main">
                  ❌ Brak danych z OCR
                </Typography>
              )}
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cały tekst z dokumentu
              </Typography>
              <TextField
                multiline
                fullWidth
                value={result.text}
                variant="outlined"
                rows={15}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                }}
              />
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tekst podzielony na strony
              </Typography>
              {result.pages?.map((page, index) => (
                <Accordion 
                  key={index}
                  expanded={expandedPage === index}
                  onChange={() => setExpandedPage(expandedPage === index ? null : index)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      Strona {page.page} ({page.text?.length || 0} znaków)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      multiline
                      fullWidth
                      value={page.text}
                      variant="outlined"
                      rows={10}
                      InputProps={{
                        readOnly: true,
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                      }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<CopyIcon />}
                        onClick={() => copyToClipboard(page.text)}
                      >
                        Kopiuj stronę
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">
                  Lista linii tekstu ({filteredLines.length})
                </Typography>
                <TextField
                  size="small"
                  placeholder="Szukaj w liniach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ minWidth: 300 }}
                />
              </Box>
              
              <Paper variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                <List>
                  {filteredLines.map((line, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <Chip label={index + 1} size="small" variant="outlined" />
                        </ListItemIcon>
                        <ListItemText
                          primary={highlightText(line, searchTerm)}
                          sx={{ fontFamily: 'monospace' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(line)}
                          title="Kopiuj linię"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                      {index < filteredLines.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* Debug Info */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary">
            Plik: {result.filename} | 
            Przetworzony przez: {result.uploaded_by_user_id} | 
            Data: {new Date(result.created_at).toLocaleString('pl-PL')}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default OCRProcessor;