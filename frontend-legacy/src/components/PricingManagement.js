import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Update as UpdateIcon,
  Add as AddIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Euro as EuroIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';
import { handleApiError, logError } from '../utils/errorHandler';

// Polish currency formatter
const formatPLN = (amount) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

function PricingManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricingStats, setPricingStats] = useState({
    totalServices: 0,
    activeProducts: 0,
    pendingQuotes: 0,
    avgMargin: 0,
    lastUpdated: new Date(),
    recentActivity: []
  });

  // Load pricing dashboard data
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setError('');
        
        const [products, services, quotes] = await Promise.all([
          apiService.getProducts({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
          // Note: Services API might not be implemented yet, using fallback
          Promise.resolve({ data: [], total: 0 }),
          apiService.getQuotes({ limit: 5 }).catch(() => ({ quotes: [], total: 0 })),
        ]);

        // Calculate average margin from products
        const productsData = Array.isArray(products) ? products : (products.data || []);
        const avgMargin = productsData.length > 0 
          ? productsData.reduce((sum, product) => {
              const purchase = parseFloat(product.purchase_price_per_unit) || 0;
              const selling = parseFloat(product.selling_price_per_unit) || 0;
              return sum + (purchase > 0 ? ((selling - purchase) / purchase * 100) : 0);
            }, 0) / productsData.length
          : 0;

        setPricingStats({
          totalServices: services.total || 0,
          activeProducts: products.total || productsData.length,
          pendingQuotes: quotes.total || 0,
          avgMargin: avgMargin,
          lastUpdated: new Date(),
          recentActivity: [
            { id: 1, type: 'price_update', description: 'Zaktualizowano ceny produktów z kategorii "flooring"', time: '2 godz. temu' },
            { id: 2, type: 'new_quote', description: 'Utworzono nową ofertę #Q-2024-001', time: '4 godz. temu' },
            { id: 3, type: 'margin_alert', description: 'Niska marża dla produktu FL001', time: '1 dzień temu' }
          ]
        });
      } catch (error) {
        logError(error, 'Pricing dashboard data fetch');
        const errorInfo = handleApiError(error);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new_quote':
        navigate('/pricing/quote-builder');
        break;
      case 'multiple_quotes':
        navigate('/pricing/multiple-quotes');
        break;
      case 'update_prices':
        navigate('/pricing/margin-calculator');
        break;
      case 'service_tiers':
        // Service tier manager - może być zaimplementowany później
        alert('Zarządzanie poziomami cenowymi usług będzie dostępne w kolejnej wersji');
        break;
      case 'margin_calculator':
        navigate('/pricing/margin-calculator');
        break;
      case 'invoice_generator':
        navigate('/pricing/invoice-generator');
        break;
      case 'nip_validator':
        navigate('/pricing/nip-validator');
        break;
      default:
        break;
    }
  };

  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      onRetry={() => window.location.reload()}
      loadingText="Ładowanie panelu zarządzania cenami..."
      errorTitle="Błąd ładowania danych cenowych"
    >
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Panel Główny
          </Link>
          <Typography color="textPrimary">Zarządzanie Cenami</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Zarządzanie Cenami
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Usługi, produkty i generowanie ofert w jednym miejscu
          </Typography>
          
          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleQuickAction('new_quote')}
              size="large"
            >
              Nowa Oferta
            </Button>
            <Button
              variant="outlined"
              startIcon={<UpdateIcon />}
              onClick={() => handleQuickAction('update_prices')}
              size="large"
            >
              Aktualizuj Ceny
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left Panel - Main Content */}
          <Grid item xs={12} md={8}>
            {/* Quick Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                      <BuildIcon />
                    </Avatar>
                    <Typography variant="h5" color="primary">
                      {pricingStats.totalServices}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Usługi
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                      <InventoryIcon />
                    </Avatar>
                    <Typography variant="h5" color="secondary">
                      {pricingStats.activeProducts.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Produkty
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                      <ReceiptIcon />
                    </Avatar>
                    <Typography variant="h5" sx={{ color: '#9c27b0' }}>
                      {pricingStats.pendingQuotes}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Oferty
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Typography variant="h5" color="success.main">
                      {pricingStats.avgMargin.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Śr. Marża
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Service Pricing Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <BuildIcon sx={{ mr: 1 }} />
                  Cenniki Usług
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => handleQuickAction('service_tiers')}
                >
                  Zarządzaj
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                System zarządzania usługami będzie dostępny wkrótce. 
                Obecnie możesz zarządzać produktami i tworzyć oferty.
              </Alert>
              
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body1">
                  Funkcja zarządzania cenami usług zostanie wdrożona w kolejnej fazie rozwoju.
                </Typography>
              </Box>
            </Paper>

            {/* Products Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InventoryIcon sx={{ mr: 1 }} />
                  Produkty i Marże
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalculateIcon />}
                  onClick={() => handleQuickAction('margin_calculator')}
                >
                  Kalkulator Marż
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip 
                  label={`${pricingStats.activeProducts.toLocaleString()} produktów aktywnych`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`Średnia marża: ${pricingStats.avgMargin.toFixed(1)}%`}
                  color={pricingStats.avgMargin > 20 ? 'success' : pricingStats.avgMargin > 10 ? 'warning' : 'error'}
                  variant="outlined"
                />
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<InventoryIcon />}
                onClick={() => navigate('/products')}
                sx={{ py: 2 }}
              >
                Przejdź do Katalogu Produktów
              </Button>
            </Paper>

            {/* Bulk Operations */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <UpdateIcon sx={{ mr: 1 }} />
                Operacje Masowe
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EuroIcon />}
                    onClick={() => handleQuickAction('update_prices')}
                    sx={{ py: 2 }}
                  >
                    Aktualizacja Cen
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TimelineIcon />}
                    disabled
                    sx={{ py: 2 }}
                  >
                    Analiza Marż (Wkrótce)
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Panel - Activity & Quick Actions */}
          <Grid item xs={12} md={4}>
            {/* Recent Activity */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Ostatnia Aktywność
              </Typography>
              
              <List>
                {pricingStats.recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: activity.type === 'price_update' ? 'primary.main' :
                                activity.type === 'new_quote' ? 'secondary.main' : 'warning.main',
                        width: 32, 
                        height: 32 
                      }}>
                        {activity.type === 'price_update' ? <EuroIcon /> :
                         activity.type === 'new_quote' ? <ReceiptIcon /> : <NotificationsIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {activity.description}
                        </Typography>
                      }
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Narzędzia Cenowe */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Narzędzia Cenowe
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickAction('new_quote')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<AddIcon />}
                  >
                    Kreator Ofert
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickAction('multiple_quotes')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<BuildIcon />}
                    color="primary"
                  >
                    Generator Wielu Ofert
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickAction('margin_calculator')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<CalculateIcon />}
                    color="secondary"
                  >
                    Kalkulator Marż
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickAction('invoice_generator')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<ReceiptIcon />}
                    color="success"
                  >
                    Generator Faktur
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleQuickAction('nip_validator')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<BuildIcon />}
                    color="info"
                  >
                    Walidator NIP/REGON
                  </Button>
                </Grid>
              </Grid>
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
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<InventoryIcon />}
                  >
                    Katalog Produktów
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/quotes')}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                    startIcon={<ReceiptIcon />}
                  >
                    Zarządzaj Ofertami
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/contacts')}
                    sx={{ justifyContent: 'flex-start' }}
                    startIcon={<BuildIcon />}
                  >
                    Lista Kontaktów
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LoadingErrorState>
  );
}

export default PricingManagement;