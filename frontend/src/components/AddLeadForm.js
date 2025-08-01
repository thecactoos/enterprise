import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { apiService } from '../services/api.service';

// Polish business constants

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


// Polish validation functions
const validatePolishPostalCode = (postalCode) => {
  const regex = /^\d{2}-\d{3}$/;
  return regex.test(postalCode) || !postalCode;
};

const validatePolishPhoneNumber = (phone) => {
  const regex = /^\+48\d{9}$/;
  return regex.test(phone) || !phone;
};


const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) || !email;
};

const AddLeadForm = ({ open, onClose, onSuccess, initialData = null }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    
    // Company Information
    company: '',
    website: '',
    companySize: '',
    industry: '',
    nip: '',
    regon: '',
    krs: '',
    
    // Address Information
    street: '',
    city: '',
    postalCode: '',
    voivodeship: '',
    country: 'Polska',
    
    // Lead Classification
    source: 'WEBSITE',
    status: 'NEW',
    priority: 'MEDIUM',
    leadType: 'B2C',
    projectType: 'RESIDENTIAL',
    
    // Project Details
    projectDescription: '',
    expectedArea: '',
    timeline: '',
    requirements: [],
    
    // Financial Information
    estimatedBudget: '',
    actualBudget: '',
    currency: 'PLN',
    
    // Qualification Data
    interestLevel: 5,
    buyingPower: 5,
    decisionMakingAuthority: 'Medium',
    
    // Additional Information
    referralSource: '',
    notes: '',
    tags: [],
    
    // Consent & Communication
    gdprConsent: false,
    marketingConsent: false,
    communicationChannel: 'email',
    
    // Follow-up
    nextFollowUp: '',
    
    // Custom fields
    customFields: {}
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Initialize form with existing data
  React.useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const steps = [
    'Dane Kontaktowe',
    'Szczegóły Projektu'
  ];

  // Validation functions
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Dane Kontaktowe
        if (!formData.firstName.trim()) newErrors.firstName = 'Imię jest wymagane';
        if (!formData.lastName.trim()) newErrors.lastName = 'Nazwisko jest wymagane';
        if (!formData.email.trim()) newErrors.email = 'Email jest wymagany';
        else if (!validateEmail(formData.email)) newErrors.email = 'Nieprawidłowy format email';
        if (formData.phone && !validatePolishPhoneNumber(formData.phone)) {
          newErrors.phone = 'Numer telefonu musi być w formacie +48XXXXXXXXX';
        }
        // Firma wymagana tylko dla B2B
        if (formData.leadType === 'B2B' && !formData.company.trim()) {
          newErrors.company = 'Nazwa firmy jest wymagana dla leadów B2B';
        }
        // Podstawowa walidacja adresu
        if (formData.postalCode && !validatePolishPostalCode(formData.postalCode)) {
          newErrors.postalCode = 'Kod pocztowy musi być w formacie XX-XXX';
        }
        break;
        
      case 1: // Szczegóły Projektu
        if (!formData.projectDescription.trim()) {
          newErrors.projectDescription = 'Krótki opis projektu jest wymagany';
        }
        if (formData.estimatedBudget && isNaN(parseFloat(formData.estimatedBudget))) {
          newErrors.estimatedBudget = 'Budżet musi być liczbą';
        }
        // RODO wymagane
        if (!formData.gdprConsent) {
          newErrors.gdprConsent = 'Zgoda RODO jest wymagana';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };


  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    setError('');
    
    try {
      const leadData = {
        ...formData,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
        actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
        expectedArea: formData.expectedArea ? parseFloat(formData.expectedArea) : null,
        interestLevel: parseInt(formData.interestLevel),
        buyingPower: parseInt(formData.buyingPower)
      };

      const result = initialData 
        ? await apiService.updateLead(initialData.id, leadData)
        : await apiService.createLead(leadData);
      
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Błąd podczas zapisywania leada');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Dane Kontaktowe
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Dane Kontaktowe</Typography>
              </Box>
            </Grid>
            
            {/* Podstawowe dane */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Imię *"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nazwisko *"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                placeholder="+48XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone || 'Format: +48XXXXXXXXX'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Typ klienta */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Typ klienta</InputLabel>
                <Select
                  value={formData.leadType}
                  onChange={(e) => handleInputChange('leadType', e.target.value)}
                  label="Typ klienta"
                >
                  {Object.entries(LEAD_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Nazwa firmy - tylko dla B2B */}
            {formData.leadType === 'B2B' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa firmy *"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  error={!!errors.company}
                  helperText={errors.company}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {/* Podstawowy adres */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Miasto"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kod pocztowy"
                placeholder="XX-XXX"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                error={!!errors.postalCode}
                helperText={errors.postalCode || 'Format: XX-XXX'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Województwo</InputLabel>
                <Select
                  value={formData.voivodeship}
                  onChange={(e) => handleInputChange('voivodeship', e.target.value)}
                  label="Województwo"
                >
                  <MenuItem value="">Wybierz województwo</MenuItem>
                  {VOIVODESHIPS.map((voivodeship) => (
                    <MenuItem key={voivodeship} value={voivodeship}>
                      {voivodeship}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Źródło</InputLabel>
                <Select
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  label="Źródło"
                >
                  {Object.entries(LEAD_SOURCES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Szczegóły Projektu
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Szczegóły Projektu</Typography>
              </Box>
            </Grid>
            
            {/* Opis projektu */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Opis projektu *"
                placeholder="Krótko opisz, czego potrzebujesz (np. panele podłogowe do mieszkania 65m²)"
                value={formData.projectDescription}
                onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                error={!!errors.projectDescription}
                helperText={errors.projectDescription || 'Opisz krótko swoje potrzeby'}
              />
            </Grid>

            {/* Typ projektu i powierzchnia */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Typ projektu</InputLabel>
                <Select
                  value={formData.projectType}
                  label="Typ projektu"
                  onChange={(e) => handleInputChange('projectType', e.target.value)}
                >
                  {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Powierzchnia (m²)"
                type="number"
                value={formData.expectedArea}
                onChange={(e) => handleInputChange('expectedArea', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                }}
              />
            </Grid>

            {/* Budżet i termin */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Szacowany budżet (PLN)"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => handleInputChange('estimatedBudget', e.target.value)}
                error={!!errors.estimatedBudget}
                helperText={errors.estimatedBudget}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Termin realizacji"
                placeholder="np. Q2 2024, maj 2024, za 3 miesiące"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
              />
            </Grid>

            {/* Priorytet */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priorytet</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorytet"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {Object.entries(LEAD_PRIORITIES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* RODO - wymagane */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Zgody wymagane
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.gdprConsent}
                      onChange={(e) => handleInputChange('gdprConsent', e.target.checked)}
                    />
                  }
                  label="Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z RODO *"
                />
                {errors.gdprConsent && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    {errors.gdprConsent}
                  </Typography>
                )}
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.marketingConsent}
                      onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                    />
                  }
                  label="Wyrażam zgodę na otrzymywanie informacji marketingowych (opcjonalne)"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        );


      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h5">
          {initialData ? 'Edytuj Lead' : 'Dodaj Nowy Lead'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {initialData ? 
            `${initialData.firstName} ${initialData.lastName}` :
            'Wypełnij formularz, aby dodać nowego potencjalnego klienta'
          }
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Wstecz
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            Dalej
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            }}
          >
            {loading ? 'Zapisywanie...' : (initialData ? 'Zapisz Zmiany' : 'Dodaj Lead')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadForm;