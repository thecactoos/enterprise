import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Clear as ClearIcon,
  Inventory as ProductIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { handleApiError, logError } from '../utils/errorHandler';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';

function Dashboard() {
  const navigate = useNavigate();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCategory, setSearchCategory] = useState('all');
  
  // Quick add contact states
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    type: 'INDIVIDUAL'
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState('');
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalContacts: 0,
    totalQuotes: 0,
    recentProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search products
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await apiService.searchProducts({
        search: query,
        limit: 10,
        category: searchCategory === 'all' ? undefined : searchCategory
      });
      
      setSearchResults(results.data || results || []);
    } catch (error) {
      logError(error, 'Product search');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory]);

  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        
        const [products, contacts, quotes] = await Promise.all([
          apiService.getProducts({ limit: 10 }).catch(() => []),
          apiService.getContacts({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
          apiService.getQuotes({ limit: 5 }).catch(() => ({ quotes: [], total: 0 })),
        ]);

        setDashboardStats({
          totalProducts: Array.isArray(products) ? products.length : (products.total || 0),
          totalContacts: contacts.total || 0,
          totalQuotes: quotes.total || 0,
          recentProducts: Array.isArray(products) ? products.slice(0, 5) : (products.data?.slice(0, 5) || [])
        });
      } catch (error) {
        logError(error, 'Dashboard data fetch');
        const errorInfo = handleApiError(error);
        setError(errorInfo.message);
        
        if (errorInfo.shouldRedirect) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle contact form
  const handleContactSubmit = async () => {
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) {
      setContactError('Imię i nazwisko są wymagane');
      return;
    }

    setContactSubmitting(true);
    setContactError('');

    try {
      await apiService.createContact({
        ...contactForm,
        type: 'LEAD',
        source: 'website',
        businessType: 'b2c'
      });
      
      setAddContactOpen(false);
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        type: 'INDIVIDUAL'
      });
      
      // Show success message or refresh data
      alert('Kontakt został dodany pomyślnie!');
    } catch (error) {
      logError(error, 'Contact creation');
      setContactError(handleApiError(error).message);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleProductClick = (product) => {
    navigate('/products', { state: { selectedProduct: product } });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      loadingText="Ładowanie panelu głównego..."
      errorTitle="Błąd ładowania panelu"
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Panel Główny CRM
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Wyszukuj produkty i zarządzaj kontaktami w jednym miejscu
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Product Search */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ mr: 1 }} />
                Wyszukiwarka Produktów
              </Typography>
              
              {/* Search Categories */}
              <Tabs 
                value={searchCategory} 
                onChange={(e, newValue) => setSearchCategory(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Wszystkie" value="all" />
                <Tab label="Inne" value="other" />
              </Tabs>
              
              {/* Search Input */}
              <TextField
                fullWidth
                placeholder="Wyszukaj produkty po nazwie, kodzie SKU, kategorii..."
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
                      <IconButton onClick={clearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              {/* Search Results */}
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {searchLoading && (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                
                {!searchLoading && searchQuery && searchResults.length === 0 && (
                  <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                    Brak wyników dla "{searchQuery}"
                  </Typography>
                )}
                
                {!searchLoading && searchResults.length > 0 && (
                  <List>
                    {searchResults.map((product) => (
                      <ListItem 
                        key={product.id}
                        button
                        onClick={() => handleProductClick(product)}
                        divider
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#1976d2' }}>
                            <ProductIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body1" component="span">
                                {product.product_name || product.name}
                              </Typography>
                              <Chip 
                                label={product.category} 
                                size="small" 
                                sx={{ ml: 1 }}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                SKU: {product.product_code || product.sku} • {product.selling_price_per_unit || product.sellingPrice ? `${product.selling_price_per_unit || product.sellingPrice} PLN` : 'Cena na zapytanie'}
                              </Typography>
                              {product.description && (
                                <Typography variant="caption" display="block">
                                  {product.description.substring(0, 100)}...
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                
                {!searchQuery && dashboardStats.recentProducts.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Ostatnio przeglądane produkty:
                    </Typography>
                    <List>
                      {dashboardStats.recentProducts.map((product) => (
                        <ListItem 
                          key={product.id}
                          button
                          onClick={() => handleProductClick(product)}
                          divider
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#2e7d32' }}>
                              <ProductIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={product.product_name || product.name}
                            secondary={`${product.product_code || product.sku} • ${product.selling_price_per_unit || product.sellingPrice || 'N/A'} PLN`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Quick Actions & Stats */}
          <Grid item xs={12} md={4}>
            {/* Quick Add Contact */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ContactIcon sx={{ mr: 1 }} />
                Szybki Kontakt
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
                onClick={() => setAddContactOpen(true)}
                sx={{ py: 2 }}
              >
                Dodaj Nowy Kontakt
              </Button>
            </Paper>

            {/* Statistics */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statystyki
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {dashboardStats.totalProducts.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Produktów w katalogu
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="secondary">
                  {dashboardStats.totalContacts.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Kontaktów
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ color: '#9c27b0' }}>
                  {dashboardStats.totalQuotes.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ofert
                </Typography>
              </Box>
            </Paper>

            {/* Quick Navigation */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Szybka Nawigacja
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/products')}
                    sx={{ mb: 1 }}
                  >
                    Katalog Produktów
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/contacts')}
                    sx={{ mb: 1 }}
                  >
                    Lista Kontaktów
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/quotes')}
                  >
                    Zarządzaj Ofertami
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Quick Add Contact Dialog */}
        <Dialog open={addContactOpen} onClose={() => setAddContactOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Dodaj Nowy Kontakt</DialogTitle>
          <DialogContent>
            {contactError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {contactError}
              </Alert>
            )}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Imię *"
                  fullWidth
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Nazwisko *"
                  fullWidth
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Telefon"
                  fullWidth
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Firma"
                  fullWidth
                  value={contactForm.company}
                  onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddContactOpen(false)}>
              Anuluj
            </Button>
            <Button 
              onClick={handleContactSubmit}
              variant="contained"
              disabled={contactSubmitting}
            >
              {contactSubmitting ? <CircularProgress size={20} /> : 'Dodaj'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LoadingErrorState>
  );
}

export default Dashboard;