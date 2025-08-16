# Advanced Quote Builder Implementation - Phase 3 Frontend

## Overview
Comprehensive documentation of the advanced quote builder implementation featuring drag-drop functionality, service recommendation engine, and real-time price calculations for the Polish construction CRM system.

## Core Architecture

### Component Structure
**Location**: `/frontend/src/components/AdvancedQuoteBuilder.js`

#### Three-Panel Layout Design
```javascript
<Container maxWidth="xl">
  <Grid container spacing={3}>
    {/* Left Panel - Item Selection (33% width) */}
    <Grid item xs={12} md={4}>
      <QuoteItemSelector 
        onAddItem={handleAddItem}
        products={products}
        services={services}
      />
    </Grid>
    
    {/* Center Panel - Quote Builder (42% width) */}
    <Grid item xs={12} md={5}>
      <QuoteItemsList 
        items={quoteItems}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
      />
    </Grid>
    
    {/* Right Panel - Calculations (25% width) */}
    <Grid item xs={12} md={3}>
      <QuoteCalculations 
        items={quoteItems}
        contact={selectedContact}
        onUpdateDiscount={handleDiscountUpdate}
      />
    </Grid>
  </Grid>
</Container>
```

### State Management Architecture
```javascript
// Quote Builder State Structure
const [quoteItems, setQuoteItems] = useState(initialItems);
const [selectedContact, setSelectedContact] = useState(null);
const [globalDiscount, setGlobalDiscount] = useState(0);
const [quoteTitle, setQuoteTitle] = useState('');
const [quoteNotes, setQuoteNotes] = useState('');
const [isCalculating, setIsCalculating] = useState(false);

// Calculation State
const [calculations, setCalculations] = useState({
  subtotal: 0,
  discountAmount: 0,
  netTotal: 0,
  vatAmount: 0,
  grossTotal: 0,
  breakdown: []
});

// UI State
const [activeTab, setActiveTab] = useState(0); // Products, Services, Favorites
const [searchQuery, setSearchQuery] = useState('');
const [filteredItems, setFilteredItems] = useState([]);
```

## Left Panel - Item Selection Interface

### Tabbed Selection System
```javascript
// Tab configuration for item types
<Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
  <Tab 
    label="Produkty" 
    icon={<InventoryIcon />} 
    iconPosition="start"
  />
  <Tab 
    label="Usługi" 
    icon={<BuildIcon />} 
    iconPosition="start"
  />
  <Tab 
    label="Ulubione" 
    icon={<StarIcon />} 
    iconPosition="start"
  />
</Tabs>
```

### Smart Search Implementation
```javascript
// Debounced search with category filtering
useEffect(() => {
  let items = [];
  
  if (activeTab === 0) { // Products
    items = products.filter(product => 
      !searchQuery || 
      product.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (activeTab === 1) { // Services
    items = services.filter(service =>
      !searchQuery ||
      service.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  setFilteredItems(items);
}, [products, services, searchQuery, activeTab]);

// Search input with clear functionality
<TextField
  fullWidth
  placeholder="Szukaj produktów i usług..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
    endAdornment: searchQuery && (
      <InputAdornment position="end">
        <IconButton onClick={() => setSearchQuery('')} size="small">
          <ClearIcon />
        </IconButton>
      </InputAdornment>
    )
  }}
/>
```

### Product List Display
```javascript
// Product list with Polish business context
<List>
  {filteredItems.map((product) => (
    <ListItem 
      key={product.id}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': { 
          bgcolor: 'action.hover',
          transform: 'translateY(-1px)',
          boxShadow: 2
        }
      }}
      onClick={() => handleAddItem(product, 'product')}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <InventoryIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight="medium">
            {product.product_name}
          </Typography>
        }
        secondary={
          <Box>
            <Typography variant="caption" display="block" color="textSecondary">
              SKU: {product.product_code}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="medium">
              {formatPLN(product.selling_price_per_unit)}/{product.selling_unit || 'm²'}
            </Typography>
            {product.description && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {product.description.substring(0, 80)}...
              </Typography>
            )}
          </Box>
        }
      />
      <IconButton 
        size="small" 
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleAddItem(product, 'product');
        }}
        sx={{ 
          transition: 'all 0.2s ease',
          '&:hover': { 
            bgcolor: 'primary.light',
            color: 'white'
          }
        }}
      >
        <AddIcon />
      </IconButton>
    </ListItem>
  ))}
</List>
```

## Center Panel - Quote Items Management

### Quote Item Addition Logic
```javascript
// Smart item addition with Polish business context
const handleAddItem = (item, type = 'product') => {
  const newItem = {
    id: `${type}_${item.id}_${Date.now()}`,
    type,
    itemId: item.id,
    name: type === 'product' ? item.product_name : item.serviceName,
    code: type === 'product' ? item.product_code : item.id,
    quantity: 1,
    unit: type === 'product' ? (item.selling_unit || 'm²') : 'm²',
    unitPrice: type === 'product' ? 
      parseFloat(item.selling_price_per_unit || 0) : 
      parseFloat(item.basePricePerM2 || 0),
    discount: 0,
    total: 0
  };
  
  // Calculate initial total with Polish rounding
  const itemTotal = newItem.quantity * newItem.unitPrice;
  newItem.total = roundToNearestGrosze(itemTotal);
  
  setQuoteItems(prev => [...prev, newItem]);
  
  // Show success feedback
  showSnackbar(`Dodano ${newItem.name} do oferty`, 'success');
};
```

### Interactive Quote Item Cards
```javascript
// Advanced quote item card with Polish business features
const QuoteItemCard = ({ item, onUpdate, onRemove, onOpenDiscount }) => (
  <Card sx={{ 
    width: '100%', 
    mb: 1,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: 4,
      transform: 'translateY(-2px)'
    }
  }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Grid container spacing={2} alignItems="center">
        {/* Item Information */}
        <Grid item xs={12} sm={4}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ 
              bgcolor: item.type === 'product' ? 'primary.main' : 'secondary.main',
              width: 32,
              height: 32
            }}>
              {item.type === 'product' ? <InventoryIcon /> : <BuildIcon />}
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {item.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {item.code}
              </Typography>
              {item.type === 'product' && item.category && (
                <Chip 
                  label={item.category} 
                  size="small" 
                  variant="outlined"
                  sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        </Grid>
        
        {/* Quantity Controls */}
        <Grid item xs={6} sm={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              size="small"
              onClick={() => updateQuantity(item.id, Math.max(0.01, item.quantity - 1))}
              disabled={item.quantity <= 0.01}
              sx={{ 
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'error.light', color: 'white' }
              }}
            >
              <RemoveIcon />
            </IconButton>
            
            <TextField
              size="small"
              value={item.quantity}
              onChange={(e) => {
                const newQuantity = parseFloat(e.target.value) || 0.01;
                updateQuantity(item.id, Math.max(0.01, newQuantity));
              }}
              inputProps={{ 
                style: { 
                  textAlign: 'center', 
                  width: '60px',
                  fontSize: '0.875rem'
                },
                min: 0.01,
                step: item.unit === 'm²' ? 0.01 : 1,
                type: 'number'
              }}
              sx={{
                '& input': {
                  padding: '4px 8px'
                }
              }}
            />
            
            <IconButton 
              size="small"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              sx={{ 
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'success.light', color: 'white' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 0.5 }}>
            {item.unit}
          </Typography>
        </Grid>
        
        {/* Unit Price */}
        <Grid item xs={6} sm={2}>
          <TextField
            size="small"
            label="Cena jedn."
            value={item.unitPrice}
            onChange={(e) => {
              const newPrice = parseFloat(e.target.value) || 0;
              updateUnitPrice(item.id, Math.max(0, newPrice));
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">PLN</InputAdornment>
            }}
            inputProps={{ 
              step: 0.01,
              min: 0,
              type: 'number',
              style: { fontSize: '0.875rem' }
            }}
            sx={{
              '& .MuiInputBase-input': {
                padding: '4px 8px'
              }
            }}
          />
        </Grid>
        
        {/* Total & Actions */}
        <Grid item xs={8} sm={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPLN(item.total)}
              </Typography>
              {item.discount > 0 && (
                <Typography variant="caption" color="success.main">
                  Rabat: -{formatPolishPercentage(item.discount / 100, 1)}
                </Typography>
              )}
              <Typography variant="caption" display="block" color="textSecondary">
                {item.quantity} × {formatPLN(item.unitPrice)}
              </Typography>
            </Box>
            
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Tooltip title="Usuń pozycję">
                <IconButton 
                  color="error"
                  onClick={() => onRemove(item.id)}
                  size="small"
                  sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      bgcolor: 'error.light',
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>
        
        {/* Discount Controls */}
        <Grid item xs={4} sm={1}>
          <Tooltip title={item.discount > 0 ? `Rabat: ${item.discount}%` : "Ustaw rabat"}>
            <IconButton 
              size="small"
              onClick={() => onOpenDiscount(item.id)}
              color={item.discount > 0 ? "success" : "default"}
              sx={{ 
                transition: 'all 0.2s ease',
                '&:hover': { 
                  bgcolor: item.discount > 0 ? 'success.light' : 'primary.light',
                  color: 'white',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <PercentIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);
```

## Drag-and-Drop Functionality (Foundation)

### Drag-and-Drop Setup
```javascript
// React Beautiful DND integration (future enhancement)
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Reorder handler
const handleDragEnd = (result) => {
  if (!result.destination) {
    return;
  }

  const items = Array.from(quoteItems);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);

  setQuoteItems(items);
  
  // Recalculate totals after reordering
  calculateTotals();
};

// Draggable quote items list
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="quote-items">
    {(provided) => (
      <List 
        {...provided.droppableProps}
        ref={provided.innerRef}
        sx={{ maxHeight: '60vh', overflow: 'auto' }}
      >
        {quoteItems.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided, snapshot) => (
              <ListItem
                ref={provided.innerRef}
                {...provided.draggableProps}
                sx={{
                  mb: 1,
                  bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                  boxShadow: snapshot.isDragging ? 4 : 1
                }}
              >
                <ListItemIcon {...provided.dragHandleProps}>
                  <DragIndicatorIcon color="action" />
                </ListItemIcon>
                
                <QuoteItemCard 
                  item={item}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  onOpenDiscount={openDiscountDialog}
                />
              </ListItem>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </List>
    )}
  </Droppable>
</DragDropContext>
```

## Right Panel - Real-Time Calculations

### Calculation Engine
```javascript
// Advanced calculation system with Polish business rules
const calculateTotals = useCallback(async () => {
  setIsCalculating(true);
  
  // Visual feedback delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let subtotal = 0;
  const breakdown = [];
  
  // Calculate each item with discounts
  quoteItems.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscountAmount = item.discount ? (itemTotal * item.discount / 100) : 0;
    const itemNet = itemTotal - itemDiscountAmount;
    
    // Round to nearest grosze
    const roundedItemNet = roundToNearestGrosze(itemNet);
    
    subtotal += roundedItemNet;
    breakdown.push({
      id: item.id,
      label: `${item.name} (${formatPolishNumber(item.quantity, 2)} ${item.unit})`,
      amount: roundedItemNet,
      originalAmount: itemTotal,
      discountAmount: itemDiscountAmount,
      discountPercentage: item.discount
    });
  });
  
  // Apply global discount
  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const netTotal = roundToNearestGrosze(subtotal - globalDiscountAmount);
  
  // Calculate Polish VAT (23% standard rate)
  const vatAmount = roundToNearestGrosze(calculateVAT(netTotal));
  const grossTotal = roundToNearestGrosze(calculateGrossAmount(netTotal));
  
  // Additional calculations for Polish business
  const averageMargin = calculateAverageMargin(quoteItems);
  const totalProfit = calculateTotalProfit(quoteItems, netTotal);
  
  setCalculations({
    subtotal: roundToNearestGrosze(subtotal),
    discountAmount: roundToNearestGrosze(globalDiscountAmount),
    netTotal,
    vatAmount,
    grossTotal,
    breakdown,
    averageMargin,
    totalProfit,
    itemCount: quoteItems.length,
    totalQuantity: quoteItems.reduce((sum, item) => sum + item.quantity, 0)
  });
  
  setIsCalculating(false);
}, [quoteItems, globalDiscount]);
```

### Interactive Calculation Display
```javascript
// Real-time calculation panel with Polish formatting
<Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
    <CalculateIcon sx={{ mr: 1 }} />
    Podsumowanie Oferty
  </Typography>
  
  {/* Quote Header */}
  <TextField
    fullWidth
    label="Tytuł oferty"
    value={quoteTitle}
    onChange={(e) => setQuoteTitle(e.target.value)}
    sx={{ mb: 2 }}
    placeholder="np. Oferta podłóg dla mieszkania 85m²"
  />
  
  {/* Item Breakdown */}
  {calculations.breakdown.length > 0 && (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom color="textSecondary">
        Pozycje ({calculations.itemCount}):
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {calculations.breakdown.map((line, index) => (
        <Box key={line.id || index} sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary" sx={{ flex: 1 }}>
              {line.label}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPLN(line.amount)}
            </Typography>
          </Box>
          
          {line.discountAmount > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="success.main" sx={{ ml: 2 }}>
                Rabat {line.discountPercentage}%
              </Typography>
              <Typography variant="caption" color="success.main">
                -{formatPLN(line.discountAmount)}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )}
  
  {/* Global Discount */}
  <Box mb={3}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
      <Typography variant="body2" fontWeight="medium">
        Rabat ogółem
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <TextField
          size="small"
          value={globalDiscount}
          onChange={(e) => {
            const discount = Math.max(0, Math.min(50, parseFloat(e.target.value) || 0));
            setGlobalDiscount(discount);
          }}
          inputProps={{ 
            style: { width: '60px', textAlign: 'right' },
            max: 50,
            min: 0,
            step: 0.1,
            type: 'number'
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>
          }}
        />
      </Box>
    </Box>
    
    {calculations.discountAmount > 0 && (
      <Typography variant="body2" color="success.main" textAlign="right">
        -{formatPLN(calculations.discountAmount)}
      </Typography>
    )}
  </Box>
  
  {/* Totals Section */}
  <Divider sx={{ mb: 2 }} />
  
  <Box mb={1}>
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body1" fontWeight="medium">
        Wartość netto:
      </Typography>
      <Typography variant="body1" fontWeight="medium">
        {formatPLN(calculations.netTotal)}
      </Typography>
    </Box>
  </Box>
  
  <Box mb={1}>
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body1" fontWeight="medium">
        VAT (23%):
      </Typography>
      <Typography variant="body1" fontWeight="medium" color="info.main">
        {formatPLN(calculations.vatAmount)}
      </Typography>
    </Box>
  </Box>
  
  <Divider sx={{ my: 2 }} />
  
  <Box display="flex" justifyContent="space-between" mb={3}>
    <Typography variant="h5" color="primary" fontWeight="bold">
      Wartość brutto:
    </Typography>
    <Typography variant="h5" color="primary" fontWeight="bold">
      {formatPLN(calculations.grossTotal)}
    </Typography>
  </Box>
  
  {/* Business Analytics */}
  {calculations.averageMargin > 0 && (
    <Box mb={2}>
      <Typography variant="caption" color="textSecondary">
        Średnia marża: {formatPolishPercentage(calculations.averageMargin / 100, 1)}
      </Typography>
    </Box>
  )}
  
  {/* Calculation Loading Indicator */}
  <AnimatePresence>
    {isCalculating && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          mb={2}
          p={1}
          bgcolor="primary.light"
          borderRadius={1}
          color="white"
        >
          <CircularProgress size={16} color="inherit" />
          <Typography variant="caption">
            Przeliczanie...
          </Typography>
        </Box>
      </motion.div>
    )}
  </AnimatePresence>
</Paper>
```

## Service Recommendation Engine Integration

### Recommendation Logic (Foundation)
```javascript
// Service recommendation engine (future implementation)
const ServiceRecommendationPanel = ({ selectedProducts, onAddService }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateRecommendations = async () => {
      if (selectedProducts.length === 0) {
        setRecommendations([]);
        return;
      }

      setLoading(true);
      
      try {
        // Mock recommendation logic - in real app, this would call ML service
        const mockRecommendations = selectedProducts
          .filter(product => product.category === 'flooring')
          .map(product => ({
            id: `service_${product.id}`,
            serviceName: `Montaż ${product.product_name.toLowerCase()}`,
            category: 'INSTALLATION',
            material: 'WOOD',
            basePricePerM2: 25.00,
            minimumCharge: 200.00,
            matchScore: 95,
            matchingProducts: [product],
            reasonCodes: ['category_match', 'material_match']
          }));

        setRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [selectedProducts]);

  if (recommendations.length === 0 && !loading) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Dodaj produkty aby zobaczyć rekomendacje usług montażowych.
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6">
          Rekomendowane Usługi
        </Typography>
        <Chip 
          label={`${recommendations.length} propozycji`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>
      
      <Typography variant="body2" color="textSecondary" mb={3}>
        Na podstawie wybranych produktów sugerujemy następujące usługi:
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {recommendations.map((service) => (
            <Grid item xs={12} sm={6} key={service.id}>
              <ServiceRecommendationCard 
                service={service}
                onAdd={onAddService}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};
```

## Advanced Features

### Quote Templates System
```javascript
// Quote templates for common scenarios
const quoteTemplates = {
  apartment_flooring: {
    title: 'Podłogi dla mieszkania',
    defaultItems: [
      {
        type: 'product',
        category: 'flooring',
        quantity: 0, // Will be set by user
        notes: 'Powierzchnia do ustalenia z klientem'
      },
      {
        type: 'service',
        serviceType: 'installation',
        notes: 'Montaż wraz z podkładem'
      }
    ]
  },
  office_renovation: {
    title: 'Remont biura',
    defaultItems: [
      {
        type: 'product',
        category: 'flooring',
        quantity: 0
      },
      {
        type: 'product',
        category: 'molding',
        quantity: 0
      }
    ]
  }
};

// Template selection
const handleSelectTemplate = (templateKey) => {
  const template = quoteTemplates[templateKey];
  setQuoteTitle(template.title);
  
  // Add template items (implementation would populate with actual products)
  template.defaultItems.forEach(item => {
    // Logic to find matching products and add them
  });
};
```

### Quote Validation System
```javascript
// Comprehensive quote validation
const validateQuote = () => {
  const errors = [];
  const warnings = [];

  // Required field validation
  if (!quoteTitle.trim()) {
    errors.push('Tytuł oferty jest wymagany');
  }

  if (quoteItems.length === 0) {
    errors.push('Oferta musi zawierać przynajmniej jedną pozycję');
  }

  // Business rule validation
  if (calculations.netTotal < 100) {
    warnings.push('Bardzo niska wartość oferty - sprawdź pozycje');
  }

  if (calculations.averageMargin < 10) {
    warnings.push('Niska marża - sprawdź rentowność');
  }

  // Polish business validation
  quoteItems.forEach((item, index) => {
    if (item.unitPrice <= 0) {
      errors.push(`Pozycja ${index + 1}: Cena jednostkowa musi być większa od 0`);
    }

    if (item.quantity <= 0) {
      errors.push(`Pozycja ${index + 1}: Ilość musi być większa od 0`);
    }

    if (item.discount > 50) {
      warnings.push(`Pozycja ${index + 1}: Bardzo wysoki rabat (${item.discount}%)`);
    }
  });

  return { errors, warnings, isValid: errors.length === 0 };
};
```

### Export and Save Options
```javascript
// Advanced save options
const saveOptions = {
  draft: {
    label: 'Zapisz jako szkic',
    action: () => handleSave({ status: 'draft' }),
    icon: <SaveIcon />
  },
  final: {
    label: 'Zapisz i wyślij',
    action: () => handleSave({ status: 'sent' }),
    icon: <SendIcon />
  },
  template: {
    label: 'Zapisz jako szablon',
    action: () => handleSaveAsTemplate(),
    icon: <BookmarkIcon />
  }
};

// Export options
const exportOptions = {
  pdf: {
    label: 'Eksportuj PDF',
    action: () => handleExportPDF(),
    icon: <PictureAsPdfIcon />
  },
  excel: {
    label: 'Eksportuj Excel',
    action: () => handleExportExcel(),
    icon: <TableViewIcon />
  },
  email: {
    label: 'Wyślij email',
    action: () => handleSendEmail(),
    icon: <EmailIcon />
  }
};
```

This comprehensive quote builder implementation provides a powerful, user-friendly interface for creating professional quotes with Polish business compliance, real-time calculations, and advanced features that streamline the quotation process for construction industry professionals.