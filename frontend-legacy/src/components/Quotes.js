import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Pagination,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  GetApp as DownloadIcon,
  Email as EmailIcon,
  FileCopy as DuplicateIcon,
  ShoppingCart as ConvertIcon,
  MonetizationOn as MoneyIcon,
  Business as BusinessIcon,
  Today as DateIcon,
  Assessment as StatusIcon,
  Assessment,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';
import MultiQuoteGenerator from './MultiQuoteGenerator';

// Quote status constants
const QUOTE_STATUSES = {
  DRAFT: 'Szkic',
  SENT: 'Wysłana',
  VIEWED: 'Wyświetlona',
  ACCEPTED: 'Zaakceptowana',
  REJECTED: 'Odrzucona',
  EXPIRED: 'Wygasła',
  CONVERTED: 'Skonwertowana'
};

const getStatusColor = (status) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'SENT': return 'info';
    case 'VIEWED': return 'warning';
    case 'ACCEPTED': return 'success';
    case 'REJECTED': return 'error';
    case 'EXPIRED': return 'error';
    case 'CONVERTED': return 'success';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'DRAFT': return <EditIcon />;
    case 'SENT': return <EmailIcon />;
    case 'VIEWED': return <ViewIcon />;
    case 'ACCEPTED': return <StatusIcon />;
    case 'REJECTED': return <StatusIcon />;
    case 'EXPIRED': return <DateIcon />;
    case 'CONVERTED': return <ConvertIcon />;
    default: return <StatusIcon />;
  }
};

const QuoteCard = React.memo(({ quote, onEdit, onView, onDelete, onDownload, onDuplicate, onConvert, onSendEmail }) => {
  const [hovered, setHovered] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered 
          ? '0 12px 24px rgba(0,0,0,0.15)' 
          : '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover .quote-actions': {
          opacity: 1,
          transform: 'translateY(0)',
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with Quote Number and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Oferta #{quote.quoteNumber || quote.id?.slice(-8)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(quote.createdAt)}
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(quote.status)}
            label={QUOTE_STATUSES[quote.status] || quote.status}
            color={getStatusColor(quote.status)}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        {/* Client Information */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              {quote.contactName ? quote.contactName.charAt(0) : <BusinessIcon />}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {quote.contactName || 'Brak nazwy'}
              </Typography>
              {quote.contactCompany && (
                <Typography variant="body2" color="text.secondary">
                  {quote.contactCompany}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Quote Value */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              {formatCurrency(quote.totalAmount)}
            </Typography>
          </Box>
          {quote.validUntil && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ważna do: {formatDate(quote.validUntil)}
            </Typography>
          )}
        </Box>

        {/* Items Count */}
        {quote.itemsCount && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Pozycji: {quote.itemsCount}
          </Typography>
        )}

        {/* Description */}
        {quote.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {quote.description}
          </Typography>
        )}

        {/* Notes */}
        {quote.notes && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Uwagi: {quote.notes}
          </Typography>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box
          className="quote-actions"
          sx={{
            display: 'flex',
            gap: 0.5,
            width: '100%',
            opacity: 0.7,
            transform: 'translateY(5px)',
            transition: 'all 0.3s ease',
            flexWrap: 'wrap'
          }}
        >
          <Tooltip title="Zobacz szczegóły">
            <IconButton size="small" onClick={() => onView(quote)} color="primary">
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edytuj">
            <IconButton size="small" onClick={() => onEdit(quote)} color="info">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Pobierz PDF">
            <IconButton size="small" onClick={() => onDownload(quote)} color="success">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Wyślij email">
            <IconButton size="small" onClick={() => onSendEmail(quote)} color="secondary">
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplikuj">
            <IconButton size="small" onClick={() => onDuplicate(quote)} color="warning">
              <DuplicateIcon />
            </IconButton>
          </Tooltip>
          {quote.status === 'ACCEPTED' && (
            <Tooltip title="Konwertuj na zamówienie">
              <IconButton size="small" onClick={() => onConvert(quote)} color="success">
                <ConvertIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Usuń">
            <IconButton size="small" onClick={() => onDelete(quote)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
});

function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [quotesPerPage] = useState(12);
  const [totalQuotes, setTotalQuotes] = useState(0);
  
  // Statistics
  const [statistics, setStatistics] = useState(null);
  
  // Dialogs
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showMultiQuoteGenerator, setShowMultiQuoteGenerator] = useState(false);

  useEffect(() => {
    fetchQuotes();
    fetchStatistics();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    // Ensure quotes is an array before filtering
    const quotesArray = Array.isArray(quotes) ? quotes : [];
    
    // Filter quotes based on search term
    if (searchTerm) {
      const filtered = quotesArray.filter(quote =>
        quote.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.contactCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuotes(filtered);
    } else {
      setFilteredQuotes(quotesArray);
    }
  }, [searchTerm, quotes]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: quotesPerPage
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const quotesData = await apiService.getQuotes(params);
      console.log('Raw quotes data:', quotesData);
      
      // Handle different response structures
      let quotesArray = [];
      let total = 0;
      
      if (Array.isArray(quotesData)) {
        quotesArray = quotesData;
        total = quotesData.length;
      } else if (quotesData && typeof quotesData === 'object') {
        quotesArray = quotesData.data || quotesData.quotes || [];
        total = quotesData.total || quotesData.count || (Array.isArray(quotesArray) ? quotesArray.length : 0);
      }
      
      // Ensure quotesArray is always an array
      if (!Array.isArray(quotesArray)) {
        quotesArray = [];
      }
      
      console.log('Processed quotes array:', quotesArray);
      console.log('Total quotes:', total);
      
      setQuotes(quotesArray);
      setTotalQuotes(total);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError('Błąd podczas ładowania ofert');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await apiService.getQuoteStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching quote statistics:', error);
    }
  };

  const handleViewQuote = useCallback((quote) => {
    setSelectedQuote(quote);
    setShowDetailsDialog(true);
  }, []);

  const handleEditQuote = useCallback((quote) => {
    // TODO: Implement edit dialog
    console.log('Edit quote:', quote);
  }, []);

  const handleDeleteQuote = useCallback(async (quote) => {
    if (window.confirm(`Czy na pewno usunąć ofertę #${quote.quoteNumber || quote.id?.slice(-8)}?`)) {
      try {
        await apiService.deleteQuote(quote.id);
        fetchQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
        setError('Błąd podczas usuwania oferty');
      }
    }
  }, []);

  const handleDownloadQuote = useCallback(async (quote) => {
    try {
      const blob = await apiService.generateQuotePDF(quote.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `oferta-${quote.quoteNumber || quote.id?.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading quote:', error);
      setError('Błąd podczas pobierania PDF');
    }
  }, []);

  const handleDuplicateQuote = useCallback(async (quote) => {
    try {
      await apiService.duplicateQuote(quote.id);
      fetchQuotes();
    } catch (error) {
      console.error('Error duplicating quote:', error);
      setError('Błąd podczas duplikowania oferty');
    }
  }, []);

  const handleConvertQuote = useCallback(async (quote) => {
    if (window.confirm(`Konwertować ofertę #${quote.quoteNumber || quote.id?.slice(-8)} na zamówienie?`)) {
      try {
        await apiService.convertQuoteToOrder(quote.id);
        fetchQuotes();
      } catch (error) {
        console.error('Error converting quote:', error);
        setError('Błąd podczas konwersji oferty');
      }
    }
  }, []);

  const handleSendEmail = useCallback((quote) => {
    setSelectedQuote(quote);
    setShowEmailDialog(true);
  }, []);

  const handlePageChange = useCallback((_event, page) => {
    setCurrentPage(page);
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchTerm('');
  }, []);

  const handleQuotesGenerated = useCallback((generatedQuotes) => {
    // Refresh the quotes list to show newly generated quotes
    fetchQuotes();
    setShowMultiQuoteGenerator(false);
    
    // Show success message
    const successCount = generatedQuotes.length;
    if (successCount > 0) {
      // You could show a snackbar or alert here
      console.log(`Successfully generated ${successCount} quotes`);
    }
  }, [fetchQuotes]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 2,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Zarządzanie Ofertami
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Tworzenie, zarządzanie i śledzenie ofert dla klientów
        </Typography>

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {statistics.total || totalQuotes}
                </Typography>
                <Typography variant="body2">Wszystkie Oferty</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {statistics.accepted || 0}
                </Typography>
                <Typography variant="body2">Zaakceptowane</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {statistics.averageValue ? Math.round(statistics.averageValue / 1000) : 0}K
                </Typography>
                <Typography variant="body2">Śr. Wartość (PLN)</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {statistics.conversionRate || 0}%
                </Typography>
                <Typography variant="body2">Konwersja</Typography>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Action Bar */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
          }}
        >
          Nowa Oferta
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => setShowMultiQuoteGenerator(true)}
          sx={{
            borderColor: '#667eea',
            color: '#667eea',
            '&:hover': {
              borderColor: '#764ba2',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            }
          }}
        >
          Generator Wielu Ofert
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ukryj Filtry' : 'Pokaż Filtry'}
        </Button>

        <Box sx={{ ml: 'auto' }}>
          <TextField
            placeholder="Szukaj ofert..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              }
            }}
          />
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filtry</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Wszystkie</MenuItem>
                  {Object.entries(QUOTE_STATUSES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                fullWidth
              >
                Wyczyść Filtry
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Quotes Grid */}
      <LoadingErrorState
        loading={loading}
        error={error}
        onRetry={fetchQuotes}
        loadingText="Ładowanie ofert..."
        errorTitle="Błąd podczas ładowania ofert"
      >
        <Grid container spacing={3}>
          {Array.isArray(filteredQuotes) && filteredQuotes.map((quote) => (
            <Grid item xs={12} sm={6} md={4} key={quote.id}>
              <QuoteCard 
                quote={quote}
                onEdit={handleEditQuote}
                onView={handleViewQuote}
                onDelete={handleDeleteQuote}
                onDownload={handleDownloadQuote}
                onDuplicate={handleDuplicateQuote}
                onConvert={handleConvertQuote}
                onSendEmail={handleSendEmail}
              />
            </Grid>
          ))}
        </Grid>

        {Array.isArray(filteredQuotes) && filteredQuotes.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <MoneyIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              Brak ofert
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? 
                'Nie znaleziono ofert spełniających kryteria wyszukiwania.' :
                'Utwórz pierwszą ofertę, aby rozpocząć zarządzanie ofertami.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
            >
              Nowa Oferta
            </Button>
          </Box>
        )}
      </LoadingErrorState>

      {/* Pagination */}
      {totalQuotes > quotesPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(totalQuotes / quotesPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Quote Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Szczegóły Oferty #{selectedQuote?.quoteNumber || selectedQuote?.id?.slice(-8)}
        </DialogTitle>
        <DialogContent>
          <Typography>Szczegóły oferty będą tutaj...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog
        open={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Wyślij Ofertę Email
        </DialogTitle>
        <DialogContent>
          <Typography>Formularz wysyłania email będzie tutaj...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDialog(false)}>Anuluj</Button>
          <Button variant="contained">Wyślij</Button>
        </DialogActions>
      </Dialog>

      {/* Multi Quote Generator Dialog */}
      <MultiQuoteGenerator
        open={showMultiQuoteGenerator}
        onClose={() => setShowMultiQuoteGenerator(false)}
        onQuotesGenerated={handleQuotesGenerated}
      />
    </Container>
  );
}

export default Quotes;