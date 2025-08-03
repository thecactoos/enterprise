import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';
import { formatPLN } from '../utils/polishFormatters';
import { handleApiError, logError } from '../utils/errorHandler';

function MultipleQuoteGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  // Data state
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Quote configuration
  const [quoteConfig, setQuoteConfig] = useState({
    area: '',
    product_id: '',
    with_installation: true,
    selectedContacts: [],
    auto_suggest_services: true,
    include_transport: true
  });
  
  // Generated quotes
  const [generatedQuotes, setGeneratedQuotes] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Steps configuration
  const steps = [
    {
      label: 'Wybierz produkty i powierzchnię',
      description: 'Określ jaki produkt i powierzchnię będą dotyczyć oferty'
    },
    {
      label: 'Wybierz kontakty',
      description: 'Zaznacz dla których kontaktów wygenerować oferty'
    },
    {
      label: 'Konfiguracja usług',
      description: 'Określ czy uwzględnić montaż i dodatkowe usługi'
    },
    {
      label: 'Generowanie ofert',
      description: 'Przegląd i generowanie wszystkich ofert'
    }
  ];

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load contacts and products in parallel
        const [contactsData, productsData] = await Promise.all([
          apiService.getContacts({ limit: 100 }).catch(() => ({ data: [] })),
          apiService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
        ]);
        
        setContacts(Array.isArray(contactsData) ? contactsData : (contactsData.data || []));
        setProducts(Array.isArray(productsData) ? productsData : (productsData.data || []));
        
      } catch (error) {
        logError(error, 'Multiple quote generator data load');
        setError(handleApiError(error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter contacts based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  // Filter products based on search
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Handle contact selection
  const toggleContact = (contactId) => {
    setQuoteConfig(prev => ({
      ...prev,
      selectedContacts: prev.selectedContacts.includes(contactId)
        ? prev.selectedContacts.filter(id => id !== contactId)
        : [...prev.selectedContacts, contactId]
    }));
  };

  // Generate quotes for all selected contacts
  const handleGenerateQuotes = async () => {
    if (!quoteConfig.area || !quoteConfig.product_id || quoteConfig.selectedContacts.length === 0) {
      setError('Wypełnij wszystkie wymagane pola i wybierz przynajmniej jeden kontakt');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const quotes = [];
      
      // Generate quotes sequentially to avoid overwhelming the server
      for (const contactId of quoteConfig.selectedContacts) {
        try {
          const quoteData = {
            area: parseFloat(quoteConfig.area),
            product_id: quoteConfig.product_id,
            client_id: contactId,
            with_installation: quoteConfig.with_installation
          };
          
          const quote = await apiService.createSimpleQuote(quoteData);
          const contact = contacts.find(c => c.id === contactId);
          
          // Auto-suggest services if enabled
          let finalQuote = quote;
          if (quoteConfig.auto_suggest_services && quote.id) {
            try {
              finalQuote = await apiService.autoSuggestServices(
                quote.id, 
                quoteConfig.include_transport
              );
            } catch (serviceError) {
              logError(serviceError, `Auto-suggest services for quote ${quote.id}`);
              // Continue with original quote if service suggestion fails
            }
          }
          
          quotes.push({
            ...finalQuote,
            contact: contact,
            status: 'success'
          });
          
        } catch (error) {
          logError(error, `Quote generation for contact ${contactId}`);
          const contact = contacts.find(c => c.id === contactId);
          quotes.push({
            contact: contact,
            status: 'error',
            error: handleApiError(error).message
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setGeneratedQuotes(quotes);
      setActiveStep(3);
      
    } catch (error) {
      logError(error, 'Multiple quote generation');
      setError(handleApiError(error).message);
    } finally {
      setGenerating(false);
    }
  };

  // Calculate total value for successful quotes
  const calculateTotalValue = () => {
    return generatedQuotes
      .filter(quote => quote.status === 'success' && quote.items)
      .reduce((total, quote) => {
        const quoteTotal = quote.items.reduce((sum, item) => sum + item.total_price, 0);
        return total + quoteTotal;
      }, 0);
  };

  const getSelectedProduct = () => {
    return products.find(p => p.id === quoteConfig.product_id);
  };

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  if (loading && contacts.length === 0) {
    return (
      <LoadingErrorState
        loading={loading}
        error={error}
        onRetry={() => window.location.reload()}
        loadingText="Ładowanie danych..."
        errorTitle="Błąd ładowania danych"
      />
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Generator Wielu Ofert
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generuj oferty dla wielu kontaktów jednocześnie na podstawie tego samego produktu i powierzchni
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Product and Area Selection */}
          <Step>
            <StepLabel>
              <Box display="flex" alignItems="center" gap={1}>
                <HomeIcon />
                <span>{steps[0].label}</span>
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {steps[0].description}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Wybierz produkt</InputLabel>
                    <Select
                      value={quoteConfig.product_id}
                      label="Wybierz produkt"
                      onChange={(e) => setQuoteConfig(prev => ({ ...prev, product_id: e.target.value }))}
                    >
                      {filteredProducts.map(product => (
                        <MenuItem key={product.id} value={product.id}>
                          <Box>
                            <Typography variant="body1">
                              {product.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.product_code} - {formatPLN(product.selling_price_per_unit)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Powierzchnia"
                    type="number"
                    value={quoteConfig.area}
                    onChange={(e) => setQuoteConfig(prev => ({ ...prev, area: e.target.value }))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m²</InputAdornment>
                    }}
                    inputProps={{ min: 0.01, step: 0.01 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!quoteConfig.area || !quoteConfig.product_id}
                  startIcon={<AssignmentIcon />}
                >
                  Dalej
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Contact Selection */}
          <Step>
            <StepLabel>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                <span>{steps[1].label}</span>
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {steps[1].description}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Wyszukaj kontakty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`Wybrano: ${quoteConfig.selectedContacts.length} kontaktów`}
                  color={quoteConfig.selectedContacts.length > 0 ? "primary" : "default"}
                  variant="outlined"
                />
              </Box>
              
              <Paper sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider' }}>
                <List>
                  {filteredContacts.map(contact => (
                    <ListItem
                      key={contact.id}
                      button
                      onClick={() => toggleContact(contact.id)}
                      selected={quoteConfig.selectedContacts.includes(contact.id)}
                    >
                      <ListItemIcon>
                        <PersonIcon color={quoteConfig.selectedContacts.includes(contact.id) ? "primary" : "disabled"} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${contact.firstName} ${contact.lastName}`}
                        secondary={
                          <Box>
                            {contact.email && <Typography variant="caption" display="block">{contact.email}</Typography>}
                            {contact.company && <Typography variant="caption" display="block">{contact.company}</Typography>}
                          </Box>
                        }
                      />
                      {quoteConfig.selectedContacts.includes(contact.id) && (
                        <CheckCircleIcon color="primary" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button onClick={handleBack}>
                  Wstecz
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={quoteConfig.selectedContacts.length === 0}
                  startIcon={<BuildIcon />}
                >
                  Dalej
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Service Configuration */}
          <Step>
            <StepLabel>
              <Box display="flex" alignItems="center" gap={1}>
                <BuildIcon />
                <span>{steps[2].label}</span>
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {steps[2].description}
              </Typography>
              
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Konfiguracja usług
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.with_installation}
                        onChange={(e) => setQuoteConfig(prev => ({ ...prev, with_installation: e.target.checked }))}
                      />
                    }
                    label="Uwzględnij montaż i dodatkowe usługi"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.auto_suggest_services}
                        onChange={(e) => setQuoteConfig(prev => ({ ...prev, auto_suggest_services: e.target.checked }))}
                      />
                    }
                    label="Automatyczne dopasowanie usług"
                    sx={{ mt: 1 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quoteConfig.include_transport}
                        onChange={(e) => setQuoteConfig(prev => ({ ...prev, include_transport: e.target.checked }))}
                        disabled={!quoteConfig.auto_suggest_services}
                      />
                    }
                    label="Uwzględnij transport w autosugestii"
                    sx={{ mt: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Montaż i usługi:</strong> Dodaje podstawowe usługi montażowe do oferty.<br/>
                    <strong>Automatyczne dopasowanie:</strong> System automatycznie dopasuje najlepsze usługi do wybranego produktu.<br/>
                    <strong>Transport:</strong> Uwzględnia koszty transportu w automatycznej sugestii usług.
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Quote Preview */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Podgląd oferty
                  </Typography>
                  
                  {getSelectedProduct() && (
                    <Box>
                      <Typography variant="body1" gutterBottom>
                        <strong>Produkt:</strong> {getSelectedProduct().product_name}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Powierzchnia:</strong> {quoteConfig.area} m²
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Montaż:</strong> {quoteConfig.with_installation ? 'Tak' : 'Nie'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Autosugestia usług:</strong> {quoteConfig.auto_suggest_services ? 'Tak' : 'Nie'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Transport:</strong> {quoteConfig.include_transport ? 'Tak' : 'Nie'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Liczba ofert:</strong> {quoteConfig.selectedContacts.length}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button onClick={handleBack}>
                  Wstecz
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerateQuotes}
                  disabled={generating}
                  startIcon={generating ? <CircularProgress size={20} /> : <CalculateIcon />}
                >
                  {generating ? 'Generowanie...' : 'Generuj Oferty'}
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Results */}
          <Step>
            <StepLabel>
              <Box display="flex" alignItems="center" gap={1}>
                <AssignmentIcon />
                <span>{steps[3].label}</span>
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Przegląd wygenerowanych ofert
              </Typography>
              
              {generatedQuotes.length > 0 && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                              {generatedQuotes.filter(q => q.status === 'success').length}
                            </Typography>
                            <Typography variant="body2">
                              Oferty wygenerowane
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error">
                              {generatedQuotes.filter(q => q.status === 'error').length}
                            </Typography>
                            <Typography variant="body2">
                              Błędy
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                              {formatPLN(calculateTotalValue())}
                            </Typography>
                            <Typography variant="body2">
                              Łączna wartość
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Szczegóły ofert
                  </Typography>
                  
                  <List>
                    {generatedQuotes.map((quote, index) => (
                      <ListItem key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        <ListItemIcon>
                          {quote.status === 'success' ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${quote.contact.firstName} ${quote.contact.lastName}`}
                          secondary={
                            quote.status === 'success' ? (
                              <Box>
                                <Typography variant="body2">
                                  Oferta #{quote.id?.slice(-8)} - {quote.items?.length || 0} pozycji
                                </Typography>
                                <Typography variant="body2" color="primary">
                                  Wartość: {formatPLN(quote.items?.reduce((sum, item) => sum + item.total_price, 0) || 0)}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="error">
                                Błąd: {quote.error}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button onClick={handleBack}>
                  Wstecz
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setActiveStep(0);
                    setGeneratedQuotes([]);
                    setQuoteConfig({
                      area: '',
                      product_id: '',
                      with_installation: true,
                      selectedContacts: [],
                      auto_suggest_services: true,
                      include_transport: true
                    });
                  }}
                  startIcon={<AddIcon />}
                >
                  Generuj Kolejne
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
    </Container>
  );
}

export default MultipleQuoteGenerator;