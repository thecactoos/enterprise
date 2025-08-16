import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Call as CallIcon,
  Mail as MailIcon,
  Transform as ConvertIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Note as NoteIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Badge as BadgeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Polish business constants (reused from AddLeadForm)
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

const PROJECT_TYPES = {
  NEW_CONSTRUCTION: 'nowa_budowa',
  RENOVATION: 'remont',
  COMMERCIAL: 'komercyjne',
  RESIDENTIAL: 'mieszkaniowe'
};

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

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'LOW': return 'default';
    case 'MEDIUM': return 'info';
    case 'HIGH': return 'warning';
    case 'URGENT': return 'error';
    default: return 'default';
  }
};

const LeadDetails = ({ open, onClose, lead, onEdit, onDelete, onConvert }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leadData, setLeadData] = useState(lead);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    if (lead && open) {
      setLeadData(lead);
      // Mock activities - in real implementation, fetch from API
      setActivities([
        {
          id: 1,
          type: 'created',
          description: 'Lead został utworzony',
          date: new Date(lead.createdAt || new Date()),
          user: 'System'
        },
        {
          id: 2,
          type: 'contacted',
          description: 'Pierwszy kontakt telefoniczny',
          date: new Date(lead.lastContact || new Date()),
          user: 'Jan Kowalski'
        },
        {
          id: 3,
          type: 'email',
          description: 'Wysłano ofertę wstępną',
          date: new Date(),
          user: 'Anna Nowak'
        }
      ]);
    }
  }, [lead, open]);

  if (!leadData) return null;

  const leadName = `${leadData.firstName} ${leadData.lastName}`;
  const qualificationScore = leadData.qualificationScore || 0;
  const isHighScore = qualificationScore >= 80;
  const estimatedBudget = parseFloat(leadData.estimatedBudget) || 0;

  const handleQuickAction = async (action) => {
    setLoading(true);
    try {
      switch (action) {
        case 'call':
          // Open phone dialer
          window.open(`tel:${leadData.phone}`);
          break;
        case 'email':
          // Open email client
          window.open(`mailto:${leadData.email}`);
          break;
        case 'convert':
          if (onConvert) onConvert(leadData);
          break;
        case 'edit':
          if (onEdit) onEdit(leadData);
          break;
        case 'delete':
          if (onDelete) onDelete(leadData);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Brak danych';
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'created': return <AddIcon />;
      case 'contacted': return <CallIcon />;
      case 'email': return <MailIcon />;
      case 'meeting': return <EventIcon />;
      case 'note': return <NoteIcon />;
      default: return <FlagIcon />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: getStatusColor(leadData.status),
                width: 56, 
                height: 56,
                fontSize: '1.5rem'
              }}
            >
              {leadName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {leadName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={LEAD_STATUSES[leadData.status] || leadData.status}
                  size="medium"
                  sx={{
                    bgcolor: getStatusColor(leadData.status),
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                <Chip
                  label={LEAD_PRIORITIES[leadData.priority] || leadData.priority}
                  size="medium"
                  color={getPriorityColor(leadData.priority)}
                />
                {isHighScore && (
                  <Chip
                    icon={<StarIcon />}
                    label="Wysoki wynik"
                    size="medium"
                    color="warning"
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zadzwoń">
              <IconButton 
                color="primary" 
                onClick={() => handleQuickAction('call')}
                disabled={!leadData.phone}
              >
                <CallIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Wyślij email">
              <IconButton 
                color="primary" 
                onClick={() => handleQuickAction('email')}
                disabled={!leadData.email}
              >
                <MailIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edytuj">
              <IconButton 
                color="info" 
                onClick={() => handleQuickAction('edit')}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Konwertuj na klienta">
              <IconButton 
                color="success" 
                onClick={() => handleQuickAction('convert')}
              >
                <ConvertIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Usuń">
              <IconButton 
                color="error" 
                onClick={() => handleQuickAction('delete')}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zamknij">
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={0}>
          {/* Left Column - Main Information */}
          <Grid item xs={12} md={8}>
            <Box sx={{ p: 3 }}>
              {/* Contact Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Informacje Kontaktowe</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body1">{leadData.email}</Typography>
                      </Box>
                      {leadData.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">{leadData.phone}</Typography>
                        </Box>
                      )}
                      {leadData.position && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">{leadData.position}</Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      {leadData.company && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BusinessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">{leadData.company}</Typography>
                        </Box>
                      )}
                      {(leadData.city || leadData.voivodeship) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {[leadData.city, leadData.voivodeship].filter(Boolean).join(', ')}
                          </Typography>
                        </Box>
                      )}
                      {leadData.leadType && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Typography variant="body1">{leadData.leadType}</Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Project Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Informacje o Projekcie</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      {leadData.projectType && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Typ projektu
                          </Typography>
                          <Typography variant="body1">
                            {PROJECT_TYPES[leadData.projectType] || leadData.projectType}
                          </Typography>
                        </Box>
                      )}
                      
                      {leadData.expectedArea && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Powierzchnia
                          </Typography>
                          <Typography variant="body1">
                            {leadData.expectedArea} m²
                          </Typography>
                        </Box>
                      )}
                      
                      {leadData.timeline && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Harmonogram
                          </Typography>
                          <Typography variant="body1">
                            {leadData.timeline}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      {estimatedBudget > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Szacowany budżet
                          </Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            {estimatedBudget.toLocaleString('pl-PL')} {leadData.currency || 'PLN'}
                          </Typography>
                        </Box>
                      )}
                      
                      {leadData.source && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Źródło leada
                          </Typography>
                          <Typography variant="body1">
                            {LEAD_SOURCES[leadData.source] || leadData.source}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  
                  {leadData.projectDescription && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Opis projektu
                      </Typography>
                      <Typography variant="body1">
                        {leadData.projectDescription}
                      </Typography>
                    </Box>
                  )}
                  
                  {leadData.requirements && leadData.requirements.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Wymagania
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {leadData.requirements.map((req, index) => (
                          <Chip key={index} label={req} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Dodatkowe Informacje</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Company Details */}
                    {(leadData.nip || leadData.regon || leadData.krs || leadData.companySize || leadData.industry) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Dane Firmowe
                        </Typography>
                        {leadData.nip && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">NIP:</Typography>
                            <Typography variant="body1">{leadData.nip}</Typography>
                          </Box>
                        )}
                        {leadData.regon && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">REGON:</Typography>
                            <Typography variant="body1">{leadData.regon}</Typography>
                          </Box>
                        )}
                        {leadData.krs && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">KRS:</Typography>
                            <Typography variant="body1">{leadData.krs}</Typography>
                          </Box>
                        )}
                        {leadData.companySize && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Wielkość:</Typography>
                            <Typography variant="body1">{leadData.companySize} pracowników</Typography>
                          </Box>
                        )}
                        {leadData.industry && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Branża:</Typography>
                            <Typography variant="body1">{leadData.industry}</Typography>
                          </Box>
                        )}
                      </Grid>
                    )}

                    {/* Address */}
                    {(leadData.street || leadData.city || leadData.postalCode) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Adres
                        </Typography>
                        {leadData.street && (
                          <Typography variant="body1">{leadData.street}</Typography>
                        )}
                        {(leadData.postalCode || leadData.city) && (
                          <Typography variant="body1">
                            {[leadData.postalCode, leadData.city].filter(Boolean).join(' ')}
                          </Typography>
                        )}
                        {leadData.voivodeship && (
                          <Typography variant="body1">{leadData.voivodeship}</Typography>
                        )}
                        {leadData.country && (
                          <Typography variant="body1">{leadData.country}</Typography>
                        )}
                      </Grid>
                    )}

                    {/* Notes */}
                    {leadData.notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                          Notatki
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50', 
                          borderRadius: 1,
                          fontStyle: 'italic'
                        }}>
                          {leadData.notes}
                        </Typography>
                      </Grid>
                    )}

                    {/* Tags */}
                    {leadData.tags && leadData.tags.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                          Tagi
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {leadData.tags.map((tag, index) => (
                            <Chip key={index} label={tag} color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Grid>

          {/* Right Column - Score & Activities */}
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100%' }}>
              {/* Qualification Score */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Wynik Kwalifikacji</Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 700,
                      color: isHighScore ? 'success.main' : 'primary.main'
                    }}>
                      {qualificationScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isHighScore ? 'Wysoko wykwalifikowany' : 'Wymaga dalszej kwalifikacji'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={qualificationScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isHighScore ? 'success.main' : 'primary.main',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Qualification Factors */}
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Czynniki Kwalifikacji
                  </Typography>
                  
                  {leadData.interestLevel && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Zainteresowanie:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {leadData.interestLevel}/10
                      </Typography>
                    </Box>
                  )}
                  
                  {leadData.buyingPower && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Siła nabywcza:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {leadData.buyingPower}/10
                      </Typography>
                    </Box>
                  )}
                  
                  {leadData.decisionMakingAuthority && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Władza decyzyjna:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {leadData.decisionMakingAuthority === 'Low' ? 'Niska' : 
                         leadData.decisionMakingAuthority === 'Medium' ? 'Średnia' : 'Wysoka'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Timeline/Activities */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Historia Aktywności</Typography>
                    <Button
                      size="small"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                    >
                      {showAllActivities ? 'Pokaż mniej' : 'Pokaż wszystkie'}
                    </Button>
                  </Box>

                  <List>
                    {activities
                      .slice(0, showAllActivities ? activities.length : 3)
                      .map((activity) => (
                      <ListItem key={activity.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                przez {activity.user}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(activity.date)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  {activities.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Brak aktywności
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Kluczowe Daty</Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AddIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Utworzony"
                        secondary={formatDate(leadData.createdAt)}
                      />
                    </ListItem>
                    
                    {leadData.lastContact && (
                      <ListItem>
                        <ListItemIcon>
                          <CallIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Ostatni kontakt"
                          secondary={formatDate(leadData.lastContact)}
                        />
                      </ListItem>
                    )}
                    
                    {leadData.nextFollowUp && (
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Następny kontakt"
                          secondary={formatDate(leadData.nextFollowUp)}
                        />
                      </ListItem>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <EditIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Ostatnia aktualizacja"
                        secondary={formatDate(leadData.updatedAt)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose}>
          Zamknij
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => handleQuickAction('edit')}
          disabled={loading}
        >
          Edytuj
        </Button>
        <Button
          variant="contained"
          startIcon={<ConvertIcon />}
          onClick={() => handleQuickAction('convert')}
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          }}
        >
          Konwertuj na Klienta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadDetails;