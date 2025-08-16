# Pricing Interfaces Implementation - Phase 3 Frontend

## Overview
Detailed documentation of pricing management UI implementation with focus on Polish currency formatting, real-time calculations, and business compliance.

## Polish Currency Formatting Implementation

### Core Formatting Functions
**Location**: `/frontend/src/utils/polishFormatters.js`

#### Primary Currency Formatter
```javascript
export const formatPLN = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 PLN';
  }
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Examples:
// formatPLN(1234.56) → "1 234,56 PLN"
// formatPLN(45.5) → "45,50 PLN"
// formatPLN(1000000) → "1 000 000,00 PLN"
```

#### Number Formatting with Polish Locale
```javascript
export const formatPolishNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
  }
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

// Examples:
// formatPolishNumber(1234.567, 2) → "1 234,57"
// formatPolishNumber(999, 0) → "999"
```

#### Percentage Formatting
```javascript
export const formatPolishPercentage = (percentage, decimals = 1) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '') + '%';
  }
  
  return new Intl.NumberFormat('pl-PL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage);
};

// Examples:
// formatPolishPercentage(0.235, 1) → "23,5%"
// formatPolishPercentage(0.05, 2) → "5,00%"
```

### Input Field Integration

#### Currency Input Components
```javascript
// Material UI TextField with Polish currency formatting
<TextField
  fullWidth
  label="Cena sprzedaży"
  type="number"
  value={formData.sellingPrice}
  onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
  InputProps={{
    endAdornment: <InputAdornment position="end">PLN/m²</InputAdornment>
  }}
  inputProps={{ 
    min: 0, 
    step: 0.01,
    style: { textAlign: 'right' } // Right-align for currency
  }}
  helperText={`Sformatowane: ${formatPLN(formData.sellingPrice)}`}
/>
```

#### Percentage Input with Validation
```javascript
<TextField
  fullWidth
  label="Docelowa marża"
  type="number"
  value={targetMargin}
  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
  InputProps={{
    endAdornment: <InputAdornment position="end">%</InputAdornment>
  }}
  inputProps={{ 
    min: 0, 
    max: 100, 
    step: 0.1 
  }}
  error={targetMargin < 0 || targetMargin > 100}
  helperText={
    targetMargin < 0 ? 'Marża nie może być ujemna' :
    targetMargin > 100 ? 'Marża nie może przekraczać 100%' :
    `Sformatowane: ${formatPolishPercentage(targetMargin / 100, 1)}`
  }
/>
```

## Real-Time Calculation Mechanisms

### Quote Builder Calculations
**Location**: `/frontend/src/components/AdvancedQuoteBuilder.js`

#### Real-Time Calculation Hook
```javascript
const calculateTotals = useCallback(async () => {
  setIsCalculating(true);
  
  // Add visual feedback delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let subtotal = 0;
  const breakdown = [];
  
  // Calculate each item total
  quoteItems.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscountAmount = item.discount ? (itemTotal * item.discount / 100) : 0;
    const itemNet = itemTotal - itemDiscountAmount;
    
    subtotal += itemNet;
    breakdown.push({
      label: `${item.name} (${item.quantity} ${item.unit})`,
      amount: itemNet
    });
  });
  
  // Apply global discount
  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const netTotal = subtotal - globalDiscountAmount;
  
  // Calculate Polish VAT (23% standard rate)
  const vatAmount = calculateVAT(netTotal);
  const grossTotal = calculateGrossAmount(netTotal);
  
  setCalculations({
    subtotal,
    discountAmount: globalDiscountAmount,
    netTotal,
    vatAmount,
    grossTotal,
    breakdown
  });
  
  setIsCalculating(false);
}, [quoteItems, globalDiscount]);

// Trigger recalculation when items change
useEffect(() => {
  calculateTotals();
}, [calculateTotals]);
```

#### Visual Feedback for Calculations
```javascript
// Calculation indicator component
{isCalculating && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Box 
      display="flex" 
      alignItems="center" 
      gap={1} 
      mt={2}
      color="primary.main"
    >
      <CircularProgress size={16} />
      <Typography variant="caption">
        Przeliczanie...
      </Typography>
    </Box>
  </motion.div>
)}
```

### Product Margin Calculator
**Location**: `/frontend/src/components/ProductMarginCalculator.js`

#### Dynamic Pricing Calculation
```javascript
const calculatePricing = () => {
  const { purchasePrice, targetMargin, calculationMode, retailMarkup } = formData;
  
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

  // Round to nearest 5 groszy (Polish pricing convention)
  sellingPrice = roundToNearestGrosze(sellingPrice);
  
  // Calculate retail price with markup
  const retailPrice = sellingPrice * (1 + retailMarkup / 100);
  const roundedRetailPrice = roundToNearestGrosze(retailPrice);
  
  // Calculate current margin
  const currentMargin = calculateMarginPercentage(sellingPrice, purchasePrice) * 100;
  const profitAmount = sellingPrice - purchasePrice;
  
  // Market analysis simulation
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

  // Update form data with calculated values
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
    recommendations: generateRecommendations(currentMargin, competitionPosition)
  });
};

// Recalculate when form data changes
useEffect(() => {
  calculatePricing();
}, [formData]);
```

#### Polish Pricing Conventions
```javascript
// Round to nearest grosze (5 grosze increments)
export const roundToNearestGrosze = (amount, increment = 0.05) => {
  if (!amount || isNaN(amount)) {
    return 0;
  }
  
  return Math.round(amount / increment) * increment;
};

// Examples:
// roundToNearestGrosze(32.78) → 32.80
// roundToNearestGrosze(45.52) → 45.50
// roundToNearestGrosze(99.97) → 100.00
```

## Polish Business Compliance

### VAT Calculations (23% Standard Rate)
```javascript
// Polish VAT calculation utilities
export const calculateVAT = (netAmount, vatRate = 0.23) => {
  if (!netAmount || isNaN(netAmount)) {
    return 0;
  }
  
  return netAmount * vatRate;
};

export const calculateGrossAmount = (netAmount, vatRate = 0.23) => {
  if (!netAmount || isNaN(netAmount)) {
    return 0;
  }
  
  return netAmount * (1 + vatRate);
};

export const calculateNetAmount = (grossAmount, vatRate = 0.23) => {
  if (!grossAmount || isNaN(grossAmount)) {
    return 0;
  }
  
  return grossAmount / (1 + vatRate);
};
```

#### VAT Display in Calculations
```javascript
// Quote calculations display
<Box display="flex" justifyContent="space-between">
  <Typography variant="body1">
    Wartość netto:
  </Typography>
  <Typography variant="body1" fontWeight="medium">
    {formatPLN(calculations.netTotal)}
  </Typography>
</Box>

<Box display="flex" justifyContent="space-between">
  <Typography variant="body1">
    VAT (23%):
  </Typography>
  <Typography variant="body1" fontWeight="medium">
    {formatPLN(calculations.vatAmount)}
  </Typography>
</Box>

<Divider sx={{ my: 2 }} />
<Box display="flex" justifyContent="space-between">
  <Typography variant="h5" color="primary">
    Wartość brutto:
  </Typography>
  <Typography variant="h5" color="primary" fontWeight="bold">
    {formatPLN(calculations.grossTotal)}
  </Typography>
</Box>
```

### Polish Date Formatting
```javascript
export const formatPolishDate = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

// Example: formatPolishDate(new Date()) → "15.08.2024"
```

#### Date Input Components
```javascript
// Date picker with Polish locale
<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
  <DatePicker
    label="Data wystawienia"
    value={invoiceData.issueDate}
    onChange={(date) => updateInvoiceData('issueDate', date)}
    renderInput={(params) => <TextField {...params} fullWidth required />}
  />
</LocalizationProvider>
```

### NIP (Polish Tax Number) Integration
```javascript
// NIP validation and formatting
export const validateNIP = (nip) => {
  if (!nip || typeof nip !== 'string') {
    return false;
  }
  
  const digits = nip.replace(/\D/g, '');
  
  if (digits.length !== 10) {
    return false;
  }
  
  // NIP checksum validation algorithm
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = digits
    .slice(0, 9)
    .split('')
    .reduce((sum, digit, index) => sum + parseInt(digit) * weights[index], 0);
  
  const controlDigit = checksum % 11;
  
  if (controlDigit === 10) {
    return false;
  }
  
  return controlDigit === parseInt(digits[9]);
};

export const formatNIP = (nip) => {
  if (!nip || typeof nip !== 'string') {
    return '';
  }
  
  const digits = nip.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  
  return nip;
};
```

## Advanced Pricing Features

### Volume Discount Calculations
```javascript
// Volume discount implementation in ProductMarginCalculator
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

// Volume discount configuration
const [volumeDiscounts, setVolumeDiscounts] = useState([
  { quantity: 50, discount: 5 },   // 5% discount for 50+ m²
  { quantity: 100, discount: 8 }   // 8% discount for 100+ m²
]);
```

#### Volume Discount Display
```javascript
// Visual representation of volume discounts
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
```

### Competitive Position Analysis
```javascript
// Market position visualization
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

// Visual price position indicator
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
```

### Margin Analysis and Recommendations
```javascript
// Intelligent recommendation system
const generateRecommendations = (currentMargin, competitionPosition) => {
  const recommendations = [];
  
  if (currentMargin < 15) {
    recommendations.push({
      type: 'warning',
      message: 'Niska marża - rozważ zwiększenie ceny sprzedaży',
      action: 'increase_price'
    });
  }
  
  if (currentMargin > 50) {
    recommendations.push({
      type: 'info',
      message: 'Bardzo wysoka marża - sprawdź konkurencyjność',
      action: 'check_competition'
    });
  }
  
  if (competitionPosition === 'high') {
    recommendations.push({
      type: 'warning',
      message: 'Cena powyżej średniej rynkowej - może wpłynąć na sprzedaż',
      action: 'lower_price'
    });
  }
  
  if (competitionPosition === 'low' && currentMargin > 20) {
    recommendations.push({
      type: 'success',
      message: 'Doskonała pozycja - konkurencyjna cena z dobrą marżą',
      action: 'maintain_price'
    });
  }
  
  return recommendations;
};

// Recommendation display
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
```

## User Experience Enhancements

### Input Validation and Feedback
```javascript
// Real-time validation with Polish messaging
const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.purchasePrice || formData.purchasePrice <= 0) {
    errors.purchasePrice = 'Cena zakupu musi być większa od 0';
  }
  
  if (formData.targetMargin < 0) {
    errors.targetMargin = 'Marża nie może być ujemna';
  }
  
  if (formData.targetMargin > 1000) {
    errors.targetMargin = 'Marża wydaje się zbyt wysoka';
  }
  
  if (formData.sellingPrice <= formData.purchasePrice) {
    errors.sellingPrice = 'Cena sprzedaży musi być wyższa od ceny zakupu';
  }
  
  return errors;
};
```

### Keyboard Shortcuts and Accessibility
```javascript
// Keyboard navigation support
useEffect(() => {
  const handleKeyPress = (event) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      handleSaveQuote();
    }
    
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      calculateTotals();
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  
  return () => {
    document.removeEventListener('keydown', handleKeyPress);
  };
}, [handleSaveQuote, calculateTotals]);
```

### Mobile-Responsive Pricing Interfaces
```javascript
// Responsive grid system for pricing displays
const useStyles = makeStyles((theme) => ({
  priceCard: {
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
  calculationPanel: {
    [theme.breakpoints.down('sm')]: {
      position: 'static',
      marginTop: theme.spacing(2),
    },
    [theme.breakpoints.up('sm')]: {
      position: 'sticky',
      top: 20,
    },
  },
}));

// Responsive component layout
<Grid container spacing={3}>
  <Grid item xs={12} md={4}>
    {/* Item selection - full width on mobile */}
  </Grid>
  <Grid item xs={12} md={5}>
    {/* Quote builder - full width on mobile */}
  </Grid>
  <Grid item xs={12} md={3}>
    {/* Calculations - stacks below on mobile */}
  </Grid>
</Grid>
```

This comprehensive pricing interface implementation provides a robust, user-friendly, and business-compliant solution for Polish construction industry pricing management, with real-time calculations, proper formatting, and excellent user experience across all device types.