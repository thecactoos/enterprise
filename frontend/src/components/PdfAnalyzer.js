import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Collapse,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import apiService from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';

function PdfAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [ocrConfig, setOcrConfig] = useState({
    language: 'en',
    use_angle_cls: true,
    use_gpu: false,
  });
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'ch', name: 'Chinese' },
    { code: 'french', name: 'French' },
    { code: 'german', name: 'German' },
    { code: 'korean', name: 'Korean' },
    { code: 'japan', name: 'Japanese' },
  ]);

  useEffect(() => {
    // Load OCR configuration on component mount
    loadOcrConfig();
  }, []);

  const loadOcrConfig = async () => {
    try {
      const config = await apiService.getOcrConfig();
      setOcrConfig(prev => ({
        ...prev,
        ...config
      }));
    } catch (error) {
      console.warn('Failed to load OCR config:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
      setAnalysisResult(null);
      setUploadProgress(0);
      setProcessingProgress(0);
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };



  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add OCR configuration if different from defaults
      if (ocrConfig.language !== 'en' || !ocrConfig.use_angle_cls || ocrConfig.use_gpu) {
        formData.append('ocr_config', JSON.stringify(ocrConfig));
      }

      // Show upload progress
      setUploadProgress(50);
      
      // Upload and process in one request
      const result = await apiService.analyzePdf(formData);
      
      setUploadProgress(100);
      setProcessingProgress(100);
      
      setAnalysisResult(result);
    } catch (error) {
      console.error('PDF Analysis Error:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to analyze PDF');
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setProcessingProgress(0);
    }
  };

  const handleRetry = () => {
    setError('');
    setAnalysisResult(null);
    handleAnalyze();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatProcessingTime = (seconds) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const renderProgress = () => {
    if (!loading) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Uploading PDF...
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={uploadProgress} 
          sx={{ mb: 2 }}
        />
        
        {uploadProgress === 100 && (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Processing with OCR...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={processingProgress}
              color="secondary"
            />
          </>
        )}
      </Box>
    );
  };

  const renderAdvancedOptions = () => {
    return (
      <Collapse in={showAdvancedOptions}>
        <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            OCR Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select
                  value={ocrConfig.language}
                  label="Language"
                  onChange={(e) => setOcrConfig(prev => ({ ...prev, language: e.target.value }))}
                >
                  {availableLanguages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={ocrConfig.use_angle_cls}
                      onChange={(e) => setOcrConfig(prev => ({ ...prev, use_angle_cls: e.target.checked }))}
                      size="small"
                    />
                  }
                  label="Use Angle Classification"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={ocrConfig.use_gpu}
                      onChange={(e) => setOcrConfig(prev => ({ ...prev, use_gpu: e.target.checked }))}
                      size="small"
                    />
                  }
                  label="Use GPU (if available)"
                />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Collapse>
    );
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { pages, total_pages, processing_time, ocr_config: usedConfig } = analysisResult;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Analysis Results
            </Typography>
            <Chip 
              icon={<CheckCircleIcon />}
              label={`Processed ${total_pages} page${total_pages > 1 ? 's' : ''}`}
              color="success"
              variant="outlined"
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Processing Time
              </Typography>
              <Typography variant="body1">
                {formatProcessingTime(processing_time)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="textSecondary">
                OCR Language
              </Typography>
              <Typography variant="body1">
                {usedConfig?.language?.toUpperCase() || 'EN'}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {pages && pages.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Extracted Text by Page
              </Typography>
              
              {pages.map((page, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Typography variant="subtitle2">
                        Page {page.page_number}
                      </Typography>
                      <Chip 
                        label={`${(page.confidence * 100).toFixed(1)}% confidence`}
                        color={getConfidenceColor(page.confidence)}
                        size="small"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatProcessingTime(page.processing_time)}
                      </Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <Tooltip title="View extracted text">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPage(page);
                              setImageDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace', 
                        whiteSpace: 'pre-wrap',
                        backgroundColor: '#f5f5f5',
                        padding: 2,
                        borderRadius: 1,
                        maxHeight: 300,
                        overflow: 'auto'
                      }}>
                        {page.text || 'No text extracted from this page.'}
                      </Typography>
                      
                      {page.bounding_boxes && page.bounding_boxes.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            {page.bounding_boxes.length} text regions detected
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderImageDialog = () => {
    if (!selectedPage) return null;

    return (
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Page {selectedPage.page_number} - Extracted Text
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Confidence: {(selectedPage.confidence * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Processing Time: {formatProcessingTime(selectedPage.processing_time)}
            </Typography>
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
            <Typography variant="body2" sx={{ 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {selectedPage.text || 'No text extracted from this page.'}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          PDF OCR Analyzer
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Upload PDF files to extract text using advanced OCR technology. 
          Supports both text-based and scanned documents.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Upload PDF
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select a PDF file to analyze. The service will automatically detect 
              if it's text-based or scanned and apply appropriate processing.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                fullWidth
              >
                Select PDF File
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </Button>
              
              {selectedFile && (
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected File
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedFile(null)}
                      sx={{ ml: 1 }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="text"
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                sx={{ alignSelf: 'flex-start' }}
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
              </Button>

              {renderAdvancedOptions()}

              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <TextFieldsIcon />}
                fullWidth
                size="large"
              >
                {loading ? 'Processing...' : 'Analyze PDF'}
              </Button>

              {renderProgress()}
            </Box>
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={8}>
          <LoadingErrorState
            loading={loading}
            error={error}
            onRetry={handleRetry}
            loadingText="Processing PDF with OCR..."
            errorTitle="PDF Analysis Failed"
          >
            {renderAnalysisResult()}
          </LoadingErrorState>
        </Grid>
      </Grid>

      {renderImageDialog()}
    </Container>
  );
}

export default PdfAnalyzer; 