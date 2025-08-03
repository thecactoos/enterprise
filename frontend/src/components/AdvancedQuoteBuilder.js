import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Divider,
  Stack,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Star as StarIcon,
  Percent as PercentIcon,
  Save as SaveIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Email as EmailIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Calculate as CalculateIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';
import { formatPLN, calculateVAT, calculateGrossAmount } from '../utils/polishFormatters';
import { handleApiError, logError } from '../utils/errorHandler';

function AdvancedQuoteBuilder({ contactId, initialItems = [], onSave, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [suggestedServices, setSuggestedServices] = useState([]);
  
  // Quote state
  const [quoteItems, setQuoteItems] = useState(initialItems);
  const [selectedContact, setSelectedContact] = useState(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Calculation state
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    netTotal: 0,
    vatAmount: 0,
    grossTotal: 0,
    breakdown: []
  });

  // Dialog states
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountItemId, setDiscountItemId] = useState(null);
  const [itemDiscount, setItemDiscount] = useState(0);

  // Load initial data (tylko kontakt, bez produktów)
  useEffect(() => {
    const loadData = async () => {
      try {
        setError('');
        
        const contactData = contactId ? await apiService.getContact(contactId).catch(() => null) : null;

        setSelectedContact(contactData);
        
        // Services will be implemented in future phase
        setServices([]);
        
        if (contactData) {
          setQuoteTitle(`Oferta dla ${contactData.firstName} ${contactData.lastName}`);
        }
        
      } catch (error) {
        logError(error, 'Quote builder data load');
        setError(handleApiError(error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contactId]);

  // Debounced search for products
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setFilteredItems([]);
      return;
    }

    const searchTimeoutId = setTimeout(async () => {
      if (activeTab === 0) { // Products
        try {
          setLoading(true);
          const productsData = await apiService.getProducts({ 
            search: searchQuery,
            limit: 20 
          }).catch(() => ({ data: [] }));
          
          const productsList = Array.isArray(productsData) ? productsData : (productsData.data || []);
          setFilteredItems(productsList);
        } catch (error) {
          logError(error, 'Product search');
          setFilteredItems([]);
        } finally {
          setLoading(false);
        }
      } else if (activeTab === 1) { // Services
        const items = services.filter(service =>
          service.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredItems(items);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeoutId);
  }, [searchQuery, activeTab, services]);

  // Calculate totals
  const calculateTotals = useCallback(async () => {
    setIsCalculating(true);
    
    // Add small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let subtotal = 0;
    const breakdown = [];
    
    // Calculate subtotal for each item
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
    
    // Calculate VAT (23% standard rate)
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

  // Recalculate when items or discounts change
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Add item to quote
  const handleAddItem = async (item, type = 'product') => {
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
    
    // Calculate initial total
    newItem.total = newItem.quantity * newItem.unitPrice;
    
    setQuoteItems(prev => [...prev, newItem]);

    // Auto-suggest services when a product is added
    if (type === 'product') {
      try {
        const services = await apiService.getSuggestedServices(
          item.id, 
          item.product_name, 
          item.category
        );
        setSuggestedServices(prev => [...prev, ...services]);
      } catch (error) {
        logError(error, 'Get suggested services');
        // Continue without services if suggestion fails
      }
    }
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    setQuoteItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, quantity: newQuantity };
        const itemTotal = updated.quantity * updated.unitPrice;
        const discountAmount = updated.discount ? (itemTotal * updated.discount / 100) : 0;
        updated.total = itemTotal - discountAmount;
        return updated;
      }
      return item;
    }));
  };

  // Update unit price
  const updateUnitPrice = (itemId, newPrice) => {
    if (newPrice < 0) return;
    
    setQuoteItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, unitPrice: newPrice };
        const itemTotal = updated.quantity * updated.unitPrice;
        const discountAmount = updated.discount ? (itemTotal * updated.discount / 100) : 0;
        updated.total = itemTotal - discountAmount;
        return updated;
      }
      return item;
    }));
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Open discount dialog
  const openDiscountDialog = (itemId) => {
    const item = quoteItems.find(i => i.id === itemId);
    if (item) {
      setDiscountItemId(itemId);
      setItemDiscount(item.discount || 0);
      setDiscountDialogOpen(true);
    }
  };

  // Apply item discount
  const applyItemDiscount = () => {
    setQuoteItems(prev => prev.map(item => {
      if (item.id === discountItemId) {
        const updated = { ...item, discount: itemDiscount };
        const itemTotal = updated.quantity * updated.unitPrice;
        const discountAmount = updated.discount ? (itemTotal * updated.discount / 100) : 0;
        updated.total = itemTotal - discountAmount;
        return updated;
      }
      return item;
    }));
    
    setDiscountDialogOpen(false);
    setDiscountItemId(null);
    setItemDiscount(0);
  };

  // Save quote
  const handleSaveQuote = async () => {
    if (quoteItems.length === 0) {
      setError('Dodaj pozycje do oferty przed zapisaniem');
      return;
    }

    try {
      const quoteData = {
        title: quoteTitle || 'Nowa Oferta',
        contactId: selectedContact?.id,
        items: quoteItems.map(item => ({
          type: item.type,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        })),
        totalNet: calculations.netTotal,
        totalGross: calculations.grossTotal,
        globalDiscount,
        notes: quoteNotes
      };

      await apiService.createQuote(quoteData);
      
      if (onSave) {
        onSave(quoteData);
      }
    } catch (error) {
      logError(error, 'Save quote');
      setError(handleApiError(error).message);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      loadingText="Ładowanie kreatora ofert..."
      errorTitle="Błąd ładowania danych"
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Kreator Ofert
          </Typography>
          {selectedContact && (
            <Chip 
              label={`Dla: ${selectedContact.firstName} ${selectedContact.lastName}`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Left Panel - Item Selection */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '70vh', overflow: 'hidden' }}>
              <Typography variant="h6" gutterBottom>
                Dodaj Pozycje do Oferty
              </Typography>
              
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Produkty" icon={<InventoryIcon />} />
                <Tab label="Usługi" icon={<BuildIcon />} />
                <Tab label="Ulubione" icon={<StarIcon />} />
              </Tabs>
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Wpisz przynajmniej 2 znaki aby wyszukać produkty i usługi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  helperText={searchQuery.length > 0 && searchQuery.length < 2 ? "Wpisz jeszcze " + (2 - searchQuery.length) + " znak(i)" : ""}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton onClick={clearSearch} size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              
              <Box sx={{ height: 'calc(100% - 140px)', overflow: 'auto' }}>
                {activeTab === 0 && (
                  <>
                    {searchQuery.length < 2 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1">
                          Wpisz przynajmniej 2 znaki aby wyszukać produkty
                        </Typography>
                      </Box>
                    ) : loading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Wyszukiwanie produktów...
                        </Typography>
                      </Box>
                    ) : filteredItems.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <InventoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1">
                          Nie znaleziono produktów dla "{searchQuery}"
                        </Typography>
                        <Typography variant="body2">
                          Spróbuj zmienić wyszukiwane hasło
                        </Typography>
                      </Box>
                    ) : (
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
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleAddItem(product, 'product')}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <InventoryIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={product.product_name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {product.product_code}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {formatPLN(product.selling_price_per_unit)}
                              </Typography>
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
                        >
                          <AddIcon />
                        </IconButton>
                      </ListItem>
                        ))}
                      </List>
                    )}
                  </>
                )}
                
                {activeTab === 1 && (
                  <Box>
                    {suggestedServices.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="primary" gutterBottom>
                          Sugerowane usługi dla wybranych produktów:
                        </Typography>
                        <List>
                          {suggestedServices.map((service) => (
                            <ListItem 
                              key={service.id}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                mb: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'primary.50' }
                              }}
                              onClick={() => handleAddItem(service, 'service')}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                  <BuildIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={service.serviceName}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      {service.serviceCode} - {service.category}
                                    </Typography>
                                    <Typography variant="body2" color="secondary">
                                      {formatPLN(service.basePricePerM2)}/m²
                                    </Typography>
                                  </Box>
                                }
                              />
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddItem(service, 'service');
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    <Alert severity="info">
                      Zarządzanie usługami jest dostępne przez automatyczne sugestie. 
                      Dodaj produkty aby zobaczyć sugerowane usługi.
                    </Alert>
                  </Box>
                )}
                
                {activeTab === 2 && (
                  <Alert severity="info">
                    Funkcja ulubionych pozycji będzie dostępna wkrótce.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Center Panel - Quote Items */}
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: 3, height: '70vh', overflow: 'hidden' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pozycje Oferty ({quoteItems.length})
                </Typography>
                <Chip 
                  label={`Suma: ${formatPLN(calculations.grossTotal)}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <TextField
                fullWidth
                label="Tytuł oferty"
                value={quoteTitle}
                onChange={(e) => setQuoteTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ height: 'calc(100% - 120px)', overflow: 'auto' }}>
                {quoteItems.length === 0 ? (
                  <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    py={4}
                    color="text.secondary"
                  >
                    <AddShoppingCartIcon sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6">Brak pozycji w ofercie</Typography>
                    <Typography variant="body2">
                      Dodaj produkty lub usługi z lewego panelu
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {quoteItems.map((item, index) => (
                      <ListItem
                        key={item.id}
                        sx={{
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Card sx={{ width: '100%' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Grid container spacing={2} alignItems="center">
                              {/* Item Info */}
                              <Grid item xs={12} sm={4}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {item.type === 'product' ? <InventoryIcon /> : <BuildIcon />}
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {item.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {item.code}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              {/* Quantity Controls */}
                              <Grid item xs={6} sm={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <IconButton 
                                    size="small"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <RemoveIcon />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 1)}
                                    inputProps={{ 
                                      style: { textAlign: 'center', width: '60px' },
                                      min: 0.01,
                                      step: 0.01,
                                      type: 'number'
                                    }}
                                  />
                                  <IconButton 
                                    size="small"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Box>
                                <Typography variant="caption" display="block" textAlign="center">
                                  {item.unit}
                                </Typography>
                              </Grid>
                              
                              {/* Unit Price */}
                              <Grid item xs={6} sm={2}>
                                <TextField
                                  size="small"
                                  label="Cena jedn."
                                  value={item.unitPrice}
                                  onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">PLN</InputAdornment>
                                  }}
                                  inputProps={{ 
                                    step: 0.01,
                                    min: 0,
                                    type: 'number'
                                  }}
                                />
                              </Grid>
                              
                              {/* Total & Actions */}
                              <Grid item xs={8} sm={3}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Box>
                                    <Typography variant="h6" color="primary">
                                      {formatPLN(item.total)}
                                    </Typography>
                                    {item.discount > 0 && (
                                      <Typography variant="caption" color="success.main">
                                        Rabat: -{item.discount}%
                                      </Typography>
                                    )}
                                  </Box>
                                  <IconButton 
                                    color="error"
                                    onClick={() => handleRemoveItem(item.id)}
                                    size="small"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Grid>
                              
                              {/* Discount Controls */}
                              <Grid item xs={4} sm={1}>
                                <Tooltip title="Rabat">
                                  <IconButton 
                                    size="small"
                                    onClick={() => openDiscountDialog(item.id)}
                                    color={item.discount > 0 ? "success" : "default"}
                                  >
                                    <PercentIcon />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel - Calculations */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Podsumowanie Oferty
              </Typography>
              
              {/* Calculation breakdown */}
              {calculations.breakdown.length > 0 && (
                <Box mb={3}>
                  <Divider sx={{ mb: 2 }} />
                  {calculations.breakdown.map((line, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="textSecondary">
                        {line.label}
                      </Typography>
                      <Typography variant="body2">
                        {formatPLN(line.amount)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Global discount */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">
                    Rabat ogółem
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      size="small"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                      inputProps={{ 
                        style: { width: '60px', textAlign: 'right' },
                        max: 50,
                        min: 0,
                        type: 'number'
                      }}
                      InputProps={{
                        endAdornment: <span>%</span>
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
              
              {/* Totals */}
              <Divider sx={{ mb: 2 }} />
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1">
                    Wartość netto:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPLN(calculations.netTotal)}
                  </Typography>
                </Box>
              </Box>
              
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1">
                    VAT (23%):
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPLN(calculations.vatAmount)}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h5" color="primary">
                  Wartość brutto:
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatPLN(calculations.grossTotal)}
                </Typography>
              </Box>
              
              {/* Calculation indicator */}
              {isCalculating && (
                <Box display="flex" alignItems="center" gap={1} mb={2} color="primary.main">
                  <CircularProgress size={16} />
                  <Typography variant="caption">
                    Przeliczanie...
                  </Typography>
                </Box>
              )}
              
              {/* Action buttons */}
              <Stack spacing={2}>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveQuote}
                  disabled={quoteItems.length === 0}
                  fullWidth
                >
                  Zapisz Ofertę
                </Button>
                
                <Button 
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  disabled={quoteItems.length === 0}
                  fullWidth
                >
                  Generuj PDF
                </Button>
                
                {onCancel && (
                  <Button 
                    variant="text"
                    onClick={onCancel}
                    fullWidth
                  >
                    Anuluj
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Item Discount Dialog */}
        <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)}>
          <DialogTitle>Ustaw Rabat</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Rabat (%)"
                type="number"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiscountDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={applyItemDiscount} variant="contained">
              Zastosuj
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LoadingErrorState>
  );
}

export default AdvancedQuoteBuilder;