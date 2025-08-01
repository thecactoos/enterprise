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
  Fade,
  Zoom,
  Tooltip,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Stack,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  Phone as CallIcon,
  Mail as MailIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Transform as ConvertIcon
} from '@mui/icons-material';
import { apiService } from '../services/api.service';
import LoadingErrorState from './LoadingErrorState';
import AddLeadForm from './AddLeadForm';
import LeadDetails from './LeadDetails';

// Polish business constants
const LEAD_STATUSES = {
  NEW: 'nowy',
  CONTACTED: 'skontaktowany',
  QUALIFIED: 'wykwalifikowany',
  PROPOSAL_SENT: 'oferta_wysłana',
  NEGOTIATING: 'negocjacje',
  CONVERTED: 'skonwertowany',
  LOST: 'utracony',
  NURTURING: 'pielęgnowany'
};

const LEAD_SOURCES = {
  WEBSITE: 'strona_internetowa',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  GOOGLE_ADS: 'google_ads',
  REFERRAL: 'polecenie',
  EMAIL: 'email',
  PHONE: 'telefon',
  TRADE_SHOW: 'targi',
  OTHER: 'inne'
};

const LEAD_PRIORITIES = {
  LOW: 'niski',
  MEDIUM: 'średni',
  HIGH: 'wysoki',
  URGENT: 'pilny'
};

const LEAD_TYPES = {
  B2B: 'B2B',
  B2C: 'B2C',
  B2G: 'B2G'
};

const PROJECT_TYPES = {
  NEW_CONSTRUCTION: 'nowa_budowa',
  RENOVATION: 'remont',
  COMMERCIAL: 'komercyjne',
  RESIDENTIAL: 'mieszkaniowe'
};

const VOIVODESHIPS = [
  'mazowieckie', 'małopolskie', 'wielkopolskie', 'śląskie', 'lubelskie',
  'dolnośląskie', 'podkarpackie', 'zachodniopomorskie', 'łódzkie', 'kujawsko-pomorskie',
  'pomorskie', 'warmińsko-mazurskie', 'podlaskie', 'świętokrzyskie', 'lubuskie', 'opolskie'
];

// Status colors and icons
const getStatusColor = (status) => {
  switch (status) {
    case 'NEW': return '#2196F3';
    case 'CONTACTED': return '#FF9800';
    case 'QUALIFIED': return '#4CAF50';
    case 'PROPOSAL_SENT': return '#9C27B0';
    case 'NEGOTIATING': return '#FF5722';
    case 'CONVERTED': return '#4CAF50';
    case 'LOST': return '#F44336';
    case 'NURTURING': return '#607D8B';
    default: return '#9E9E9E';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'NEW': return <PersonIcon />;
    case 'CONTACTED': return <CallIcon />;
    case 'QUALIFIED': return <CheckCircleIcon />;
    case 'PROPOSAL_SENT': return <MailIcon />;
    case 'NEGOTIATING': return <TrendingUpIcon />;
    case 'CONVERTED': return <CheckCircleIcon />;
    case 'LOST': return <CancelIcon />;
    case 'NURTURING': return <ScheduleIcon />;
    default: return <PersonIcon />;
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'LOW': return 'default';
    case 'MEDIUM': return 'info';
    case 'HIGH': return 'warning';
    case 'URGENT': return 'error';
    default: return 'default';
  }
};

const LeadCard = React.memo(({ lead, index, onEdit, onView, onDelete, onConvert }) => {
  const [hovered, setHovered] = useState(false);

  const qualificationScore = useMemo(() => lead.qualificationScore || 0, [lead.qualificationScore]);
  const isHighScore = useMemo(() => qualificationScore >= 80, [qualificationScore]);
  const estimatedBudget = useMemo(() => parseFloat(lead.estimatedBudget) || 0, [lead.estimatedBudget]);

  const leadName = useMemo(() => `${lead.firstName} ${lead.lastName}`, [lead.firstName, lead.lastName]);
  const fullAddress = useMemo(() => {
    const parts = [lead.city, lead.voivodeship].filter(Boolean);
    return parts.join(', ');
  }, [lead.city, lead.voivodeship]);

  return (
    <Zoom in={true} timeout={300 + index * 100}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: hovered 
            ? '0 20px 40px rgba(0,0,0,0.15)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative',
          '&:hover': {
            '& .lead-actions': {
              opacity: 1,
              transform: 'translateY(0)',
            }
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* High score indicator */}
        {isHighScore && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Tooltip title={`Wysoki wynik: ${qualificationScore}%`}>
              <StarIcon sx={{ color: 'gold', fontSize: 24 }} />
            </Tooltip>
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header with Name and Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: getStatusColor(lead.status),
                    width: 32, 
                    height: 32
                  }}
                >
                  {leadName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Avatar>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  {leadName}
                </Typography>
              </Box>
              
              {lead.company && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {lead.company}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Tooltip title={`Status: ${LEAD_STATUSES[lead.status] || lead.status}`}>
              <Chip
                icon={getStatusIcon(lead.status)}
                label={LEAD_STATUSES[lead.status] || lead.status}
                size="small"
                sx={{
                  bgcolor: getStatusColor(lead.status),
                  color: 'white',
                  fontWeight: 500
                }}
              />
            </Tooltip>
          </Box>

          {/* Contact Information */}
          <Box sx={{ mb: 2 }}>
            {lead.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {lead.email}
                </Typography>
              </Box>
            )}
            {lead.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {lead.phone}
                </Typography>
              </Box>
            )}
            {fullAddress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {fullAddress}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Lead Type and Priority */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={lead.leadType}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={LEAD_PRIORITIES[lead.priority] || lead.priority}
              size="small"
              color={getPriorityColor(lead.priority)}
            />
          </Box>

          {/* Project Details */}
          {lead.projectType && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                <WorkIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                Typ projektu: {PROJECT_TYPES[lead.projectType] || lead.projectType}
              </Typography>
            </Box>
          )}

          {/* Budget Information */}
          {estimatedBudget > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {estimatedBudget.toLocaleString('pl-PL')} {lead.currency || 'PLN'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Qualification Score */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Wynik kwalifikacji
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: isHighScore ? 'success.main' : 'text.primary'
                }}
              >
                {qualificationScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={qualificationScore}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: isHighScore ? 'success.main' : 'primary.main',
                  borderRadius: 3
                }
              }}
            />
          </Box>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
              {lead.tags.slice(0, 3).map((tag, idx) => (
                <Chip
                  key={idx}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {lead.tags.length > 3 && (
                <Chip
                  label={`+${lead.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}

          {/* Last Contact */}
          {lead.lastContact && (
            <Typography variant="caption" color="text.secondary">
              Ostatni kontakt: {new Date(lead.lastContact).toLocaleDateString('pl-PL')}
            </Typography>
          )}
        </CardContent>

        {/* Action Buttons */}
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Box
            className="lead-actions"
            sx={{
              display: 'flex',
              gap: 1,
              width: '100%',
              opacity: 0.7,
              transform: 'translateY(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            <Tooltip title="Zobacz szczegóły">
              <IconButton size="small" onClick={() => onView(lead)} color="primary">
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edytuj">
              <IconButton size="small" onClick={() => onEdit(lead)} color="info">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Konwertuj na klienta">
              <IconButton size="small" onClick={() => onConvert(lead)} color="success">
                <ConvertIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Usuń">
              <IconButton size="small" onClick={() => onDelete(lead)} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>
    </Zoom>
  );
});

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [voivodeshipFilter, setVoivodeshipFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState({ min: '', max: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(12);
  const [totalLeads, setTotalLeads] = useState(0);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState(null);

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        
        const params = {
          page: currentPage,
          limit: leadsPerPage
        };
        
        // Add filters
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (sourceFilter !== 'all') params.source = sourceFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        if (typeFilter !== 'all') params.leadType = typeFilter;
        if (voivodeshipFilter !== 'all') params.voivodeship = voivodeshipFilter;
        if (budgetFilter.min) params.minBudget = budgetFilter.min;
        if (budgetFilter.max) params.maxBudget = budgetFilter.max;
        
        const [leadsData, statsData] = await Promise.all([
          apiService.getLeads(params),
          currentPage === 1 && !debouncedSearchTerm 
            ? apiService.getLeadStatistics() 
            : Promise.resolve(null)
        ]);
        
        setLeads(leadsData.leads || leadsData.data || leadsData);
        setFilteredLeads(leadsData.leads || leadsData.data || leadsData);
        setTotalLeads(leadsData.total || leadsData.length);
        
        if (statsData) {
          setStatistics(statsData);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [currentPage, debouncedSearchTerm, statusFilter, sourceFilter, priorityFilter, 
      typeFilter, voivodeshipFilter, budgetFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, sourceFilter, priorityFilter, typeFilter, voivodeshipFilter, budgetFilter]);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handlePageChange = useCallback((_event, page) => {
    setCurrentPage(page);
  }, []);

  const handleAddLead = useCallback(() => {
    setSelectedLead(null);
    setShowAddDialog(true);
  }, []);

  const handleAddLeadSuccess = useCallback((newLead) => {
    setLeads(prev => [newLead, ...prev]);
    setFilteredLeads(prev => [newLead, ...prev]);
    setTotalLeads(prev => prev + 1);
  }, []);

  const handleEditLead = useCallback((lead) => {
    setSelectedLead(lead);
    setShowEditDialog(true);
  }, []);

  const handleViewLead = useCallback((lead) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
  }, []);

  const handleDeleteLead = useCallback(async (lead) => {
    if (window.confirm(`Czy na pewno usunąć lead ${lead.firstName} ${lead.lastName}?`)) {
      try {
        await apiService.deleteLead(lead.id);
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        setFilteredLeads(prev => prev.filter(l => l.id !== lead.id));
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const handleConvertLead = useCallback(async (lead) => {
    if (window.confirm(`Konwertować lead ${lead.firstName} ${lead.lastName} na klienta?`)) {
      try {
        await apiService.convertLeadToClient(lead.id);
        // Refresh leads list
        window.location.reload();
      } catch (err) {
        setError(err.message);
      }
    }
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setSourceFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setVoivodeshipFilter('all');
    setBudgetFilter({ min: '', max: '' });
    setSearchTerm('');
  }, []);

  if (loading || error) {
    return <LoadingErrorState loading={loading} error={error} />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={800}>
        <Box>
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
              Zarządzanie Leadami
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Kompleksowe zarządzanie potencjalnymi klientami w branży budowlanej
            </Typography>

            {/* Statistics Cards */}
            {statistics && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {statistics.total || totalLeads}
                    </Typography>
                    <Typography variant="body2">Wszystkie Leady</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {statistics.statusCounts?.QUALIFIED || 0}
                    </Typography>
                    <Typography variant="body2">Wykwalifikowane</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {statistics.averageScore || 0}%
                    </Typography>
                    <Typography variant="body2">Śr. Wynik</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {statistics.averageBudget ? (statistics.averageBudget / 1000).toFixed(0) : 0}K
                    </Typography>
                    <Typography variant="body2">Śr. Budżet (PLN)</Typography>
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
              onClick={handleAddLead}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
              }}
            >
              Dodaj Lead
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ukryj Filtry' : 'Pokaż Filtry'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              href="/leads/analytics"
            >
              Analityka
            </Button>

            <Box sx={{ ml: 'auto' }}>
              <TextField
                placeholder="Szukaj leadów po imieniu, firmie, email..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color={isSearching ? "primary" : "action"} />
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

          {/* Advanced Filters */}
          {showFilters && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Zaawansowane Filtry</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      {Object.entries(LEAD_STATUSES).map(([key, value]) => (
                        <MenuItem key={key} value={key}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Źródło</InputLabel>
                    <Select
                      value={sourceFilter}
                      label="Źródło"
                      onChange={(e) => setSourceFilter(e.target.value)}
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      {Object.entries(LEAD_SOURCES).map(([key, value]) => (
                        <MenuItem key={key} value={key}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priorytet</InputLabel>
                    <Select
                      value={priorityFilter}
                      label="Priorytet"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      {Object.entries(LEAD_PRIORITIES).map(([key, value]) => (
                        <MenuItem key={key} value={key}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Typ</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Typ"
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      {Object.entries(LEAD_TYPES).map(([key, value]) => (
                        <MenuItem key={key} value={key}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Województwo</InputLabel>
                    <Select
                      value={voivodeshipFilter}
                      label="Województwo"
                      onChange={(e) => setVoivodeshipFilter(e.target.value)}
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      {VOIVODESHIPS.map((voivodeship) => (
                        <MenuItem key={voivodeship} value={voivodeship}>
                          {voivodeship}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={clearFilters}
                      fullWidth
                    >
                      Wyczyść
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Budget Range */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Zakres budżetu (PLN)</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', maxWidth: 300 }}>
                  <TextField
                    size="small"
                    placeholder="Min"
                    type="number"
                    value={budgetFilter.min}
                    onChange={(e) => setBudgetFilter(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Typography>-</Typography>
                  <TextField
                    size="small"
                    placeholder="Max"
                    type="number"
                    value={budgetFilter.max}
                    onChange={(e) => setBudgetFilter(prev => ({ ...prev, max: e.target.value }))}
                  />
                </Box>
              </Box>
            </Paper>
          )}

          {/* Results Info */}
          {debouncedSearchTerm && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {isSearching || loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress sx={{ flexGrow: 1, height: 4, borderRadius: 2 }} />
                    <span>Wyszukiwanie...</span>
                  </Box>
                ) : (
                  `Znaleziono ${filteredLeads.length} leadów dla "${debouncedSearchTerm}"`
                )}
              </Typography>
            </Alert>
          )}

          {/* Leads Grid */}
          <Box sx={{ position: 'relative' }}>
            {(isSearching || (loading && debouncedSearchTerm)) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                }}
              >
                <LinearProgress sx={{ width: '50%', height: 6, borderRadius: 3 }} />
              </Box>
            )}
            
            <Grid 
              container 
              spacing={3} 
              sx={{ 
                opacity: (isSearching || (loading && debouncedSearchTerm)) ? 0.6 : 1, 
                transition: 'opacity 0.3s ease' 
              }}
            >
              {filteredLeads.map((lead, index) => (
                <Grid item xs={12} sm={6} md={4} key={lead.id}>
                  <LeadCard 
                    lead={lead} 
                    index={index}
                    onEdit={handleEditLead}
                    onView={handleViewLead}
                    onDelete={handleDeleteLead}
                    onConvert={handleConvertLead}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {filteredLeads.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                Brak leadów
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {debouncedSearchTerm ? 
                  'Nie znaleziono leadów spełniających kryteria wyszukiwania.' :
                  'Dodaj pierwszy lead, aby rozpocząć zarządzanie potencjalnymi klientami.'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddLead}
              >
                Dodaj Lead
              </Button>
            </Box>
          )}

          {/* Pagination */}
          {totalLeads > leadsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(totalLeads / leadsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>

      {/* Add Lead Dialog */}
      <AddLeadForm
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddLeadSuccess}
        initialData={selectedLead}
      />

      {/* Edit Lead Dialog Placeholder */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edytuj Lead: {selectedLead && `${selectedLead.firstName} ${selectedLead.lastName}`}
        </DialogTitle>
        <DialogContent>
          <Typography>Formularz edycji leada będzie tutaj...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Anuluj</Button>
          <Button variant="contained">Zapisz Zmiany</Button>
        </DialogActions>
      </Dialog>

      {/* Lead Details Dialog */}
      <LeadDetails
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        lead={selectedLead}
        onEdit={handleEditLead}
        onDelete={handleDeleteLead}
        onConvert={handleConvertLead}
      />
    </Container>
  );
};

export default Leads;