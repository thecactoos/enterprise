import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  Alert,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { handleApiError, logError } from '../utils/errorHandler';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';
import AddLeadForm from './AddLeadForm';
import LeadDetails from './LeadDetails';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Load contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: 12,
        search: searchQuery || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };

      const response = await apiService.getContacts(params);
      
      if (response && (response.data || response.contacts)) {
        const contactsData = response.data || response.contacts || [];
        const total = response.total || response.totalPages || 0;
        
        setContacts(contactsData);
        setTotalPages(Math.ceil(total / 12));
      } else {
        setContacts([]);
        setTotalPages(1);
      }
    } catch (error) {
      logError(error, 'Contacts fetch');
      const errorInfo = handleApiError(error);
      setError(errorInfo.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Filter and search logic
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery || 
        contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || contact.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || contact.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contacts, searchQuery, typeFilter, statusFilter]);

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
  };

  const handleAddContact = () => {
    setAddContactOpen(true);
  };

  const handleContactAdded = () => {
    setAddContactOpen(false);
    fetchContacts(); // Refresh the list
  };

  const getContactTypeColor = (type) => {
    switch (type) {
      case 'LEAD': return 'primary';
      case 'CLIENT': return 'success';
      case 'PROSPECT': return 'warning';
      default: return 'default';
    }
  };

  const getContactStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'CONTACTED': return 'warning';
      case 'QUALIFIED': return 'primary';
      case 'CONVERTED': return 'success';
      case 'LOST': return 'error';
      default: return 'default';
    }
  };

  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      onRetry={fetchContacts}
      loadingText="Ładowanie kontaktów..."
      errorTitle="Błąd ładowania kontaktów"
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Zarządzanie Kontaktami
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {contacts.length} kontaktów w systemie
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddContact}
            size="large"
          >
            Dodaj Kontakt
          </Button>
        </Box>

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Szukaj kontaktów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Typ kontaktu</InputLabel>
                <Select
                  value={typeFilter}
                  label="Typ kontaktu"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Wszystkie</MenuItem>
                  <MenuItem value="LEAD">Leady</MenuItem>
                  <MenuItem value="CLIENT">Klienci</MenuItem>
                  <MenuItem value="PROSPECT">Prospekty</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Wszystkie</MenuItem>
                  <MenuItem value="NEW">Nowy</MenuItem>
                  <MenuItem value="CONTACTED">Skontaktowany</MenuItem>
                  <MenuItem value="QUALIFIED">Wykwalifikowany</MenuItem>
                  <MenuItem value="CONVERTED">Przekonwertowany</MenuItem>
                  <MenuItem value="LOST">Utracony</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
              >
                Wyczyść
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Contacts Grid */}
        <Grid container spacing={3}>
          {filteredContacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleContactClick(contact)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {contact.type === 'INDIVIDUAL' ? <PersonIcon /> : <BusinessIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap>
                        {contact.firstName} {contact.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {contact.company || 'Osoba prywatna'}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip 
                      label={contact.type || 'LEAD'} 
                      color={getContactTypeColor(contact.type)} 
                      size="small" 
                    />
                    <Chip 
                      label={contact.status || 'NEW'} 
                      color={getContactStatusColor(contact.status)} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" noWrap>
                      {contact.phone || 'Brak telefonu'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" noWrap>
                      {contact.email || 'Brak emaila'}
                    </Typography>
                  </Box>

                  {contact.budgetRange && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {contact.budgetRange} PLN
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button size="small" startIcon={<ViewIcon />}>
                    Szczegóły
                  </Button>
                  <Button size="small" startIcon={<EditIcon />}>
                    Edytuj
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty state */}
        {!loading && filteredContacts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Brak kontaktów
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL' 
                ? 'Nie znaleziono kontaktów spełniających kryteria wyszukiwania'
                : 'Dodaj pierwszy kontakt do systemu'
              }
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddContact}>
              Dodaj Pierwszy Kontakt
            </Button>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
              size="large"
            />
          </Box>
        )}

        {/* Add Contact Dialog */}
        <Dialog 
          open={addContactOpen} 
          onClose={() => setAddContactOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Dodaj Nowy Kontakt</DialogTitle>
          <DialogContent>
            <AddLeadForm 
              onSuccess={handleContactAdded}
              onCancel={() => setAddContactOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Contact Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedContact && (
            <LeadDetails
              contact={selectedContact}
              onClose={() => setDetailsOpen(false)}
              onUpdate={fetchContacts}
            />
          )}
        </Dialog>
      </Container>
    </LoadingErrorState>
  );
}

export default Contacts;