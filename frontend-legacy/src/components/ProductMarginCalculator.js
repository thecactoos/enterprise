import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatPLN, formatPolishPercentage, calculateMarginPercentage, roundToNearestGrosze } from '../utils/polishFormatters';

function ProductMarginCalculator({ open, onClose, product, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purchasePrice: 0,
    targetMargin: 0,
    calculationMode: 'percentage', // 'percentage' or 'fixed'
    sellingPrice: 0,
    retailPrice: 0,
    retailMarkup: 40, // Default 40% markup for retail
    installationFee: 5.2, // Default 5.2% installation fee
    supplier: '',
    currency: 'PLN',
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  const [calculations, setCalculations] = useState({
    currentMargin: 0,
    profitAmount: 0,
    competitionPosition: 'unknown',
    marketRange: { min: 0, max: 0 },
    recommendations: []
  });

  const [volumeDiscounts, setVolumeDiscounts] = useState([
    { quantity: 50, discount: 5 },
    { quantity: 100, discount: 8 }
  ]);

  // Initialize form with product data
  useEffect(() => {
    if (product && open) {
      setFormData({
        purchasePrice: parseFloat(product.purchase_price_per_unit) || 0,
        targetMargin: 28.5, // Default target margin
        calculationMode: 'percentage',
        sellingPrice: parseFloat(product.selling_price_per_unit) || 0,
        retailPrice: parseFloat(product.retail_price_per_unit) || 0,
        retailMarkup: 40,
        installationFee: 5.2,
        supplier: product.supplier || '',
        currency: 'PLN',
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }
  }, [product, open]);

  // Recalculate when form data changes
  useEffect(() => {
    calculatePricing();
  }, [formData]);

  const calculatePricing = () => {
    const { purchasePrice, targetMargin, calculationMode, retailMarkup, installationFee } = formData;
    
    if (!purchasePrice || purchasePrice <= 0) {
      setCalculations({
        currentMargin: 0,
        profitAmount: 0,
        competitionPosition: 'unknown',
        marketRange: { min: 0, max: 0 },
        recommendations: []
      });
      return;
    }

    let sellingPrice;
    
    if (calculationMode === 'percentage') {
      // Calculate selling price from target margin percentage
      sellingPrice = purchasePrice * (1 + targetMargin / 100);
    } else {
      // Use fixed amount margin
      sellingPrice = purchasePrice + targetMargin;
    }

    // Round to nearest 5 groszy
    sellingPrice = roundToNearestGrosze(sellingPrice);
    
    // Calculate retail price with markup
    const retailPrice = sellingPrice * (1 + retailMarkup / 100);
    const roundedRetailPrice = roundToNearestGrosze(retailPrice);
    
    // Calculate current margin
    const currentMargin = calculateMarginPercentage(sellingPrice, purchasePrice) * 100;
    const profitAmount = sellingPrice - purchasePrice;
    
    // Simulate market analysis (in real app, this would come from API)
    const marketRange = {
      min: purchasePrice * 1.15,  // 15% above cost
      max: purchasePrice * 1.65   // 65% above cost
    };
    
    let competitionPosition = 'middle';
    if (sellingPrice < marketRange.min + (marketRange.max - marketRange.min) * 0.33) {
      competitionPosition = 'low';
    } else if (sellingPrice > marketRange.min + (marketRange.max - marketRange.min) * 0.67) {
      competitionPosition = 'high';
    }

    // Generate recommendations
    const recommendations = [];
    if (currentMargin < 15) {
      recommendations.push({
        type: 'warning',
        message: 'Niska marża - rozważ zwiększenie ceny sprzedaży'
      });
    }
    if (currentMargin > 50) {
      recommendations.push({
        type: 'info',
        message: 'Bardzo wysoka marża - sprawdź konkurencyjność'
      });
    }
    if (competitionPosition === 'high') {
      recommendations.push({
        type: 'warning',
        message: 'Cena powyżej średniej rynkowej - może wpłynąć na sprzedaż'
      });
    }

    setFormData(prev => ({
      ...prev,
      sellingPrice: sellingPrice,
      retailPrice: roundedRetailPrice
    }));

    setCalculations({
      currentMargin,
      profitAmount,
      competitionPosition,
      marketRange,
      recommendations
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const updatedProduct = {
        ...product,
        purchase_price_per_unit: formData.purchasePrice,
        selling_price_per_unit: formData.sellingPrice,
        retail_price_per_unit: formData.retailPrice,
        supplier: formData.supplier
      };

      if (onSave) {
        await onSave(updatedProduct);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionColor = (position) => {
    switch (position) {
      case 'low': return 'success';
      case 'high': return 'error';
      default: return 'primary';
    }
  };

  const getCompetitionText = (position) => {
    switch (position) {
      case 'low': return 'Niska (konkurencyjna)';
      case 'high': return 'Wysoka';
      default: return 'Średnia';
    }
  };

  const calculateTestResult = (quantity) => {
    const basePrice = formData.sellingPrice * quantity;
    let discount = 0;
    
    // Find applicable volume discount
    const applicableDiscount = volumeDiscounts
      .filter(d => quantity >= d.quantity)
      .sort((a, b) => b.discount - a.discount)[0];
    
    if (applicableDiscount) {
      discount = basePrice * (applicableDiscount.discount / 100);
    }
    
    const netAmount = basePrice - discount;
    const vatAmount = netAmount * 0.23;
    const grossAmount = netAmount + vatAmount;
    const profit = netAmount - (formData.purchasePrice * quantity);
    
    return { netAmount, vatAmount, grossAmount, profit, discount };
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CalculateIcon />
          <Box>
            <Typography variant="h6">
              Kalkulator Marży - {product.product_code}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {product.product_name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Column - Input Form */}
          <Grid item xs={12} md={6}>
            {/* Purchase Price Section */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ceny Zakupu
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dostawca</InputLabel>
                    <Select
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                    >
                      <MenuItem value="">Wybierz dostawcę</MenuItem>
                      <MenuItem value="Supplier A">Dostawca A</MenuItem>
                      <MenuItem value="Supplier B">Dostawca B</MenuItem>
                      <MenuItem value="Supplier C">Dostawca C</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Cena zakupu"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">PLN/m²</InputAdornment>
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Data"
                    type="date"
                    value={formData.lastUpdated}
                    onChange={(e) => handleInputChange('lastUpdated', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Pricing Calculator */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Kalkulator Cen
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <RadioGroup
                  row
                  value={formData.calculationMode}
                  onChange={(e) => handleInputChange('calculationMode', e.target.value)}
                >
                  <FormControlLabel
                    value="percentage"
                    control={<Radio />}
                    label="Marża procentowa"
                  />
                  <FormControlLabel
                    value="fixed"
                    control={<Radio />}
                    label="Stała kwota PLN"
                  />
                </RadioGroup>
              </FormControl>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={formData.calculationMode === 'percentage' ? 'Docelowa marża (%)' : 'Docelowa marża (PLN)'}
                    type="number"
                    value={formData.targetMargin}
                    onChange={(e) => handleInputChange('targetMargin', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        {formData.calculationMode === 'percentage' ? '%' : 'PLN'}
                      </InputAdornment>
                    }}
                    inputProps={{ min: 0, step: formData.calculationMode === 'percentage' ? 0.1 : 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Cena sprzedaży"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">PLN/m²</InputAdornment>
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Cena detaliczna"
                    type="number"
                    value={formData.retailPrice}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">PLN/m²</InputAdornment>,
                      readOnly: true
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Narzut detaliczny"
                    type="number"
                    value={formData.retailMarkup}
                    onChange={(e) => handleInputChange('retailMarkup', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Opłata montażowa"
                    type="number"
                    value={formData.installationFee}
                    onChange={(e) => handleInputChange('installationFee', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Volume Discounts */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Rabaty za ilość
              </Typography>
              
              <Grid container spacing={2}>
                {volumeDiscounts.map((discount, index) => (
                  <Grid item xs={6} key={index}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`${discount.quantity}+ m²`}
                      value={discount.discount}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      }}
                      inputProps={{ min: 0, max: 50, step: 0.1 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column - Results */}
          <Grid item xs={12} md={6}>
            {/* Current Calculations */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Aktualne Wyliczenia
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Marża:</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" color="primary">
                    {formatPolishPercentage(calculations.currentMargin / 100)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ({formatPLN(calculations.profitAmount)})
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Cena sprzedaży:</Typography>
                <Typography variant="h6" color="primary">
                  {formatPLN(formData.sellingPrice)}
                </Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Cena detaliczna:</Typography>
                <Typography variant="h6" color="secondary">
                  {formatPLN(formData.retailPrice)}
                </Typography>
              </Box>
            </Paper>

            {/* Competition Analysis */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Analiza Konkurencji
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" gutterBottom>
                  Zakres rynkowy: {formatPLN(calculations.marketRange.min)} - {formatPLN(calculations.marketRange.max)}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="body2">Twoja pozycja:</Typography>
                  <Chip 
                    label={getCompetitionText(calculations.competitionPosition)}
                    color={getCompetitionColor(calculations.competitionPosition)}
                    size="small"
                    icon={calculations.competitionPosition === 'high' ? <TrendingUpIcon /> : 
                          calculations.competitionPosition === 'low' ? <TrendingDownIcon /> : <InfoIcon />}
                  />
                </Box>
                
                {/* Visual price position */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" gutterBottom>
                    Pozycja cenowa na rynku:
                  </Typography>
                  <Box sx={{ position: 'relative', mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ height: 20, borderRadius: 10, bgcolor: 'grey.200' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: `${Math.min(Math.max(
                          ((formData.sellingPrice - calculations.marketRange.min) / 
                           (calculations.marketRange.max - calculations.marketRange.min)) * 100, 0), 100)}%`,
                        transform: 'translateX(-50%)',
                        height: 20,
                        width: 4,
                        bgcolor: 'primary.main',
                        borderRadius: 2
                      }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption">Niska</Typography>
                    <Typography variant="caption">Średnia</Typography>
                    <Typography variant="caption">Wysoka</Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Recommendations */}
              {calculations.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle3" gutterBottom>
                    Rekomendacje:
                  </Typography>
                  {calculations.recommendations.map((rec, index) => (
                    <Alert key={index} severity={rec.type} sx={{ mb: 1 }}>
                      {rec.message}
                    </Alert>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Test Calculation */}
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Przykładowe Wyliczenie
              </Typography>
              
              {[25, 50, 100].map(quantity => {
                const result = calculateTestResult(quantity);
                return (
                  <Card key={quantity} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        {quantity} m²
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Netto:</Typography>
                          <Typography variant="body2">{formatPLN(result.netAmount)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">VAT:</Typography>
                          <Typography variant="body2">{formatPLN(result.vatAmount)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Brutto:</Typography>
                          <Typography variant="body2" fontWeight="medium">{formatPLN(result.grossAmount)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Zysk:</Typography>
                          <Typography variant="body2" color="success.main">{formatPLN(result.profit)}</Typography>
                        </Grid>
                      </Grid>
                      {result.discount > 0 && (
                        <Typography variant="caption" color="info.main">
                          Rabat: -{formatPLN(result.discount)} ({((result.discount / (result.netAmount + result.discount)) * 100).toFixed(1)}%)
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Anuluj
        </Button>
        <Button 
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={calculatePricing}
        >
          Przelicz
        </Button>
        <Button 
          variant="contained"
          onClick={handleSave}
          disabled={loading || !formData.purchasePrice || !formData.sellingPrice}
        >
          Zapisz Zmiany
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductMarginCalculator;