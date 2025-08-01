import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
} from '@mui/material';
import {
  PersonOutline as ContactIcon,
  Inventory as ProductIcon,
  Settings as ConfigIcon,
  Assessment as GenerateIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  BusinessCenter as BusinessIcon,
  Home as HomeIcon,
  Build as ServiceIcon,
  LocalShipping as DeliveryIcon,
  ExpandLess,
  ExpandMore,
  SquareFoot as AreaIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';

const steps = [
  { label: 'Wybierz Kontakt', icon: <ContactIcon /> },
  { label: 'Wybierz Produkty', icon: <ProductIcon /> },
  { label: 'Konfiguracja', icon: <ConfigIcon /> },
  { label: 'Generuj Oferty', icon: <GenerateIcon /> },
];

const MultiQuoteGenerator = ({ open, onClose, onQuotesGenerated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Contact Selection
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Step 2: Product Selection
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);

  // Step 3: Configuration
  const [quoteConfig, setQuoteConfig] = useState({
    totalArea: '',
    roomName: 'Główne pomieszczenie',
    title: 'Oferta porównawcza',
    description: '',
    preferences: {
      includeInstallation: true,
      includeTransport: true,
      includeBaseboard: false,
      serviceLevel: 'standard'
    }
  });

  // Step 4: Generation Progress
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle',
    results: []
  });
  const [showResults, setShowResults] = useState(false);

  // Load contacts on component mount
  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open]);

  // Load products when moving to step 2
  useEffect(() => {
    if (activeStep === 1 && products.length === 0) {
      fetchProducts();
    }
  }, [activeStep, products.length]);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      setError(''); // Clear previous errors
      
      console.log('Fetching contacts...');
      const response = await apiService.getContacts({ limit: 100 });
      console.log('Contacts response:', response);
      
      const contactsData = Array.isArray(response) ? response : response.data || response.contacts || [];
      console.log('Processed contacts:', contactsData);
      
      setContacts(contactsData);
      
      if (contactsData.length === 0) {
        setError('Brak kontaktów w bazie danych. Dodaj kontakt, aby móc generować oferty.');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        setError('Błąd autoryzacji - zaloguj się ponownie');
      } else if (error.response?.status === 404) {
        setError('Endpoint kontaktów nie został znaleziony');
      } else {
        setError(`Błąd podczas ładowania kontaktów: ${error.message}`);
      }
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await apiService.getProducts({ 
        limit: 500,
        search: productSearch || undefined 
      });
      setProducts(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Błąd podczas ładowania produktów');
    } finally {
      setProductsLoading(false);
    }
  };

  const validatePolishBusinessContext = () => {
    // Validate area is reasonable for Polish construction standards
    const area = parseFloat(quoteConfig.totalArea);
    if (area > 0) {
      if (area < 1) {
        return 'Obszar jest zbyt mały (minimum 1 m²)';
      }
      if (area > 10000) {
        return 'Obszar przekracza maksymalną wartość (10,000 m²)';
      }
    }

    // Validate contact has required information for Polish business
    if (selectedContact) {
      if (!selectedContact.email && !selectedContact.phone) {
        return 'Kontakt musi mieć adres email lub numer telefonu';
      }
      
      // If it's a company, suggest having NIP for tax purposes
      if (selectedContact.company && !selectedContact.nip && !selectedContact.taxId) {
        // This is just a warning, not a blocker
        console.warn('Uwaga: Firma nie ma podanego numeru NIP - może to być wymagane do faktury');
      }
    }

    return null;
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedContact) {
      setError('Wybierz kontakt aby kontynuować');
      return;
    }
    if (activeStep === 1 && selectedProducts.length === 0) {
      setError('Wybierz przynajmniej jeden produkt');
      return;
    }
    if (activeStep === 1 && selectedProducts.length > 20) {
      setError('Maksymalna liczba produktów do porównania to 20');
      return;
    }
    if (activeStep === 2) {
      if (!quoteConfig.totalArea) {
        setError('Podaj całkowity obszar (m²)');
        return;
      }
      
      const validationError = validatePolishBusinessContext();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleGenerateQuotes = async () => {
    try {
      setLoading(true);
      setError('');
      setGenerationProgress({
        current: 0,
        total: selectedProducts.length,
        status: 'processing',
        results: []
      });

      const baseQuoteData = {
        contactId: selectedContact.id,
        title: quoteConfig.title,
        description: `${quoteConfig.description}\n\nOferta dla obszaru ${quoteConfig.totalArea} m² w pomieszczeniu: ${quoteConfig.roomName}`,
        totalArea: parseFloat(quoteConfig.totalArea),
        roomName: quoteConfig.roomName,
        preferences: {
          ...quoteConfig.preferences,
          // Add Polish-specific service preferences
          includeVAT: true,
          currency: 'PLN',
          paymentTerms: '14 dni',
          warrantyPeriod: '24 miesiące'
        }
      };

      const results = await apiService.createQuotesWithProgress(
        baseQuoteData,
        selectedProducts,
        (progress) => {
          setGenerationProgress(prev => ({
            ...prev,
            current: progress.current,
            status: progress.status
          }));
        }
      );

      setGenerationProgress(prev => ({
        ...prev,
        status: 'completed',
        results
      }));

      setShowResults(true);

      // Notify parent component
      if (onQuotesGenerated) {
        onQuotesGenerated(results.filter(r => r.status === 'fulfilled'));
      }

    } catch (error) {
      console.error('Error generating quotes:', error);
      setError('Błąd podczas generowania ofert');
      setGenerationProgress(prev => ({
        ...prev,
        status: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedContact(null);
    setSelectedProducts([]);
    setQuoteConfig({
      totalArea: '',
      roomName: 'Główne pomieszczenie',
      title: 'Oferta porównawcza',
      description: '',
      preferences: {
        includeInstallation: true,
        includeTransport: true,
        includeBaseboard: false,
        serviceLevel: 'standard'
      }
    });
    setGenerationProgress({
      current: 0,
      total: 0,
      status: 'idle',
      results: []
    });
    setShowResults(false);
    setError('');
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ minWidth: 600, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Wybierz Kontakt dla Ofert
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Wszystkie oferty zostaną utworzone dla wybranego kontaktu
            </Typography>

            <LoadingErrorState
              loading={contactsLoading}
              error={error}
              onRetry={fetchContacts}
              loadingText="Ładowanie kontaktów..."
            >
              <Autocomplete
                options={contacts}
                getOptionLabel={(contact) => 
                  `${contact.name || contact.firstName + ' ' + contact.lastName} ${contact.company ? `(${contact.company})` : ''}`
                }
                renderOption={(props, contact) => (
                  <Box component="li" {...props}>
                    <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">
                        {contact.name || `${contact.firstName} ${contact.lastName}`}
                      </Typography>
                      {contact.company && (
                        <Typography variant="caption" color="text.secondary">
                          {contact.company}
                        </Typography>
                      )}
                      {contact.email && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {contact.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                value={selectedContact}
                onChange={(event, newValue) => setSelectedContact(newValue)}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Wybierz kontakt"
                    placeholder="Szukaj po nazwie, nazwie firmy lub email..."
                    variant="outlined"
                  />
                )}
              />

              {selectedContact && (
                <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Wybrany Kontakt
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Nazwa:</Typography>
                        <Typography variant="body1">
                          {selectedContact.name || `${selectedContact.firstName} ${selectedContact.lastName}`}
                        </Typography>
                      </Grid>
                      {selectedContact.company && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Firma:</Typography>
                          <Typography variant="body1">{selectedContact.company}</Typography>
                        </Grid>
                      )}
                      {selectedContact.email && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Email:</Typography>
                          <Typography variant="body1">{selectedContact.email}</Typography>
                        </Grid>
                      )}
                      {selectedContact.phone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Telefon:</Typography>
                          <Typography variant="body1">{selectedContact.phone}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </LoadingErrorState>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ minWidth: 700, minHeight: 500 }}>
            <Typography variant="h6" gutterBottom>
              Wybierz Produkty do Porównania
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Dla każdego wybranego produktu zostanie utworzona oddzielna oferta
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Szukaj produktów"
                variant="outlined"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={fetchProducts} disabled={productsLoading}>
                        Szukaj
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {selectedProducts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Wybrane Produkty ({selectedProducts.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedProducts.map(product => (
                    <Chip
                      key={product.id}
                      label={product.name || product.product_name}
                      onDelete={() => handleProductToggle(product)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <LoadingErrorState
              loading={productsLoading}
              error={error}
              onRetry={fetchProducts}
              loadingText="Ładowanie produktów..."
            >
              <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List>
                  {products.map((product) => (
                    <ListItem
                      key={product.id}
                      button
                      onClick={() => handleProductToggle(product)}
                      selected={selectedProducts.some(p => p.id === product.id)}
                    >
                      <ListItemIcon>
                        <ProductIcon color={selectedProducts.some(p => p.id === product.id) ? 'primary' : 'inherit'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={product.name || product.product_name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Kategoria: {product.category}
                            </Typography>
                            {product.selling_price_per_unit && (
                              <Typography variant="caption" display="block">
                                Cena: {formatCurrency(product.selling_price_per_unit)}/{product.selling_unit}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      {selectedProducts.some(p => p.id === product.id) && (
                        <CheckIcon color="primary" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </LoadingErrorState>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ minWidth: 600, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Konfiguracja Ofert
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Skonfiguruj podstawowe parametry dla wszystkich ofert
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Całkowity obszar (m²)"
                  type="number"
                  value={quoteConfig.totalArea}
                  onChange={(e) => setQuoteConfig(prev => ({ ...prev, totalArea: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AreaIcon /></InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa pomieszczenia"
                  value={quoteConfig.roomName}
                  onChange={(e) => setQuoteConfig(prev => ({ ...prev, roomName: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><HomeIcon /></InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tytuł ofert"
                  value={quoteConfig.title}
                  onChange={(e) => setQuoteConfig(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Opis ofert"
                  multiline
                  rows={3}
                  value={quoteConfig.description}
                  onChange={(e) => setQuoteConfig(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Preferencje Usług
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Usługi będą wycenione zgodnie z polskimi standardami branżowymi. 
                    Ceny montażu obejmują robociznę i podstawowe materiały pomocnicze.
                  </Typography>
                </Alert>
                <Box sx={{ pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.preferences.includeInstallation}
                        onChange={(e) => setQuoteConfig(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, includeInstallation: e.target.checked }
                        }))}
                      />
                    }
                    label="Uwzględnij usługi montażowe (praca + materiały pomocnicze)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.preferences.includeTransport}
                        onChange={(e) => setQuoteConfig(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, includeTransport: e.target.checked }
                        }))}
                      />
                    }
                    label="Uwzględnij transport/dostawę (na terenie Polski)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.preferences.includeBaseboard}
                        onChange={(e) => setQuoteConfig(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, includeBaseboard: e.target.checked }
                        }))}
                      />
                    }
                    label="Uwzględnij montaż listew przypodłogowych"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Poziom usług</InputLabel>
                  <Select
                    value={quoteConfig.preferences.serviceLevel}
                    label="Poziom usług"
                    onChange={(e) => setQuoteConfig(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, serviceLevel: e.target.value }
                    }))}
                  >
                    <MenuItem value="basic">Podstawowy</MenuItem>
                    <MenuItem value="standard">Standardowy</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ minWidth: 600, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Generowanie Ofert
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generowanie {selectedProducts.length} ofert dla kontaktu: {selectedContact?.name || selectedContact?.firstName + ' ' + selectedContact?.lastName}
            </Typography>

            {generationProgress.status === 'idle' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Gotowe do generowania ofert
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Kliknij "Generuj Oferty" aby rozpocząć proces
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateQuotes}
                  disabled={loading}
                  startIcon={<GenerateIcon />}
                >
                  Generuj Oferty
                </Button>
              </Box>
            )}

            {generationProgress.status === 'processing' && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Generowanie oferty {generationProgress.current} z {generationProgress.total}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(generationProgress.current / generationProgress.total) * 100} 
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Trwa generowanie ofert...
                </Typography>
              </Box>
            )}

            {generationProgress.status === 'completed' && showResults && (
              <Box>
                <Typography variant="h6" gutterBottom color="success.main">
                  Oferty zostały wygenerowane!
                </Typography>
                
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Podsumowanie:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Pomyślnie utworzone: {generationProgress.results.filter(r => r.status === 'fulfilled').length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Błędy: {generationProgress.results.filter(r => r.status === 'rejected').length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {generationProgress.results.filter(r => r.status === 'rejected').length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Niektóre oferty nie mogły zostać utworzone. Sprawdź logi dla szczegółów.
                  </Alert>
                )}
              </Box>
            )}

            {generationProgress.status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Wystąpił błąd podczas generowania ofert. Spróbuj ponownie.
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Generator Wielu Ofert</Typography>
        <Typography variant="body2" color="text.secondary">
          Utwórz porównawcze oferty dla różnych produktów
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>
          {activeStep === 3 && generationProgress.status === 'completed' ? 'Zamknij' : 'Anuluj'}
        </Button>
        
        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack}>
            Wstecz
          </Button>
        )}
        
        {activeStep < 3 && (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={loading}
          >
            {activeStep === 2 ? 'Przejdź do Generowania' : 'Dalej'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MultiQuoteGenerator;