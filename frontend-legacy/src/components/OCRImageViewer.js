import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Slider,
  Stack,
  Chip,
  Button
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';

const OCRImageViewer = ({ 
  imageFile, 
  textBlocks = [], 
  imageDimensions = { width: 1, height: 1 },
  onTextBlockClick = () => {},
  selectedTextBlock = null 
}) => {
  const [zoom, setZoom] = useState(1);
  const [showHighlights, setShowHighlights] = useState(true);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [actualImageDimensions, setActualImageDimensions] = useState({ width: 1, height: 1 });

  // Create image URL from file
  useEffect(() => {
    if (imageFile) {
      // Check if file is PDF
      if (imageFile.type === 'application/pdf') {
        // For PDF files, we can't directly display them as images
        // OCR service converts PDF to images internally, but we don't get the image back
        setImageUrl(null);
        return;
      }
      
      // For image files, create object URL
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Handle image load to get actual dimensions
  const handleImageLoad = (event) => {
    const img = event.target;
    setActualImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  // Calculate scale factor between PaddleOCR coordinates and displayed image
  const getScaleFactor = () => {
    if (!imageRef.current || !imageDimensions.width || !imageDimensions.height) {
      return { x: 1, y: 1 };
    }

    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;

    return {
      x: displayedWidth / imageDimensions.width,
      y: displayedHeight / imageDimensions.height
    };
  };

  // Convert PaddleOCR coordinates to screen coordinates
  const convertCoordinates = (bbox) => {
    const scale = getScaleFactor();
    return {
      left: bbox.x * scale.x,
      top: bbox.y * scale.y,
      width: bbox.width * scale.x,
      height: bbox.height * scale.y
    };
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoom(1);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#4caf50'; // Green
    if (confidence >= 0.7) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  if (!imageFile) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Brak pliku do wyświetlenia
        </Typography>
      </Paper>
    );
  }

  // Handle PDF files - show coordinates on white background
  const isPDF = imageFile.type === 'application/pdf';
  
  if (isPDF && !imageUrl) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2">Podgląd PDF:</Typography>
            
            <Typography variant="subtitle2">Zoom:</Typography>
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
            <Slider
              value={zoom}
              min={0.25}
              max={3}
              step={0.25}
              onChange={(_, value) => setZoom(value)}
              sx={{ width: 120 }}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={handleResetZoom} size="small">
              <CenterIcon />
            </IconButton>
            
            <Button
              startIcon={showHighlights ? <HideIcon /> : <ShowIcon />}
              onClick={() => setShowHighlights(!showHighlights)}
              variant="outlined"
              size="small"
            >
              {showHighlights ? 'Ukryj podświetlenia' : 'Pokaż podświetlenia'}
            </Button>
            <Chip 
              label={`${textBlocks.length} bloków tekstu`} 
              color="primary" 
              size="small" 
            />
          </Stack>
        </Paper>

        {/* PDF Coordinate Viewer */}
        <Paper sx={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f5f5f5', minHeight: 400 }}>
          <Box
            sx={{
              position: 'relative',
              width: `${imageDimensions.width || 800}px`,
              height: `${imageDimensions.height || 600}px`,
              backgroundColor: 'white',
              margin: '20px auto',
              border: '1px solid #ddd',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {/* Text Block Overlays for PDF */}
            {showHighlights && textBlocks.map((block, index) => {
              const isSelected = selectedTextBlock === index;
              const isHovered = hoveredBlock === index;
              
              return (
                <Tooltip
                  key={index}
                  title={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {block.text}
                      </Typography>
                      <Typography variant="caption">
                        Pewność: {Math.round(block.confidence * 100)}%
                      </Typography>
                    </Box>
                  }
                  placement="top"
                  arrow
                >
                  <Box
                    onClick={() => onTextBlockClick(index, block)}
                    onMouseEnter={() => setHoveredBlock(index)}
                    onMouseLeave={() => setHoveredBlock(null)}
                    sx={{
                      position: 'absolute',
                      left: block.bbox.x,
                      top: block.bbox.y,
                      width: block.bbox.width,
                      height: block.bbox.height,
                      border: `2px solid ${getConfidenceColor(block.confidence)}`,
                      backgroundColor: isSelected 
                        ? 'rgba(25, 118, 210, 0.3)' 
                        : isHovered 
                          ? 'rgba(25, 118, 210, 0.2)' 
                          : 'rgba(25, 118, 210, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      borderRadius: '2px',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.3)',
                        transform: 'scale(1.02)',
                        zIndex: 10
                      }
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Paper>

        {/* Selected Text Info for PDF */}
        {selectedTextBlock !== null && textBlocks[selectedTextBlock] && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Wybrany tekst:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                "{textBlocks[selectedTextBlock].text}"
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={`Pewność: ${Math.round(textBlocks[selectedTextBlock].confidence * 100)}%`}
                  color={textBlocks[selectedTextBlock].confidence >= 0.9 ? 'success' : 
                         textBlocks[selectedTextBlock].confidence >= 0.7 ? 'warning' : 'error'}
                  size="small"
                />
                <Chip 
                  label={`Pozycja: ${Math.round(textBlocks[selectedTextBlock].bbox.x)}, ${Math.round(textBlocks[selectedTextBlock].bbox.y)}`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2">Zoom:</Typography>
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
          <Slider
            value={zoom}
            min={0.25}
            max={3}
            step={0.25}
            onChange={(_, value) => setZoom(value)}
            sx={{ width: 120 }}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          />
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleResetZoom} size="small">
            <CenterIcon />
          </IconButton>
          
          <Button
            startIcon={showHighlights ? <HideIcon /> : <ShowIcon />}
            onClick={() => setShowHighlights(!showHighlights)}
            variant="outlined"
            size="small"
          >
            {showHighlights ? 'Ukryj podświetlenia' : 'Pokaż podświetlenia'}
          </Button>

          <Chip 
            label={`${textBlocks.length} bloków tekstu`} 
            color="primary" 
            size="small" 
          />
        </Stack>
      </Paper>

      {/* Image Viewer */}
      <Paper 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          position: 'relative',
          backgroundColor: '#f5f5f5',
          minHeight: 400
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {/* Main Image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="OCR Document"
            onLoad={handleImageLoad}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
          />

          {/* Text Block Overlays */}
          {showHighlights && textBlocks.map((block, index) => {
            const screenCoords = convertCoordinates(block.bbox);
            const isSelected = selectedTextBlock === index;
            const isHovered = hoveredBlock === index;
            
            return (
              <Tooltip
                key={index}
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {block.text}
                    </Typography>
                    <Typography variant="caption">
                      Pewność: {Math.round(block.confidence * 100)}%
                    </Typography>
                  </Box>
                }
                placement="top"
                arrow
              >
                <Box
                  onClick={() => onTextBlockClick(index, block)}
                  onMouseEnter={() => setHoveredBlock(index)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  sx={{
                    position: 'absolute',
                    left: screenCoords.left,
                    top: screenCoords.top,
                    width: screenCoords.width,
                    height: screenCoords.height,
                    border: `2px solid ${getConfidenceColor(block.confidence)}`,
                    backgroundColor: isSelected 
                      ? 'rgba(25, 118, 210, 0.3)' 
                      : isHovered 
                        ? 'rgba(25, 118, 210, 0.2)' 
                        : 'rgba(25, 118, 210, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: '2px',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.3)',
                      transform: 'scale(1.02)',
                      zIndex: 10
                    }
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Paper>

      {/* Selected Text Info */}
      {selectedTextBlock !== null && textBlocks[selectedTextBlock] && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Wybrany tekst:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              "{textBlocks[selectedTextBlock].text}"
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={`Pewność: ${Math.round(textBlocks[selectedTextBlock].confidence * 100)}%`}
                color={textBlocks[selectedTextBlock].confidence >= 0.9 ? 'success' : 
                       textBlocks[selectedTextBlock].confidence >= 0.7 ? 'warning' : 'error'}
                size="small"
              />
              <Chip 
                label={`Pozycja: ${Math.round(textBlocks[selectedTextBlock].bbox.x)}, ${Math.round(textBlocks[selectedTextBlock].bbox.y)}`}
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`Rozmiar: ${Math.round(textBlocks[selectedTextBlock].bbox.width)}×${Math.round(textBlocks[selectedTextBlock].bbox.height)}`}
                variant="outlined"
                size="small"
              />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default OCRImageViewer;