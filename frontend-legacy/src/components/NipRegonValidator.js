import React, { useState, useEffect, forwardRef } from 'react';
import {
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { IMaskInput } from 'react-imask';
import { formatNIP, validateNIP } from '../utils/polishFormatters';

// NIP Input Mask Component
const NIPInputMask = forwardRef(function NIPInputMask(props, ref) {
  const { onChange, ...other } = props;
  
  return (
    <IMaskInput
      {...other}
      mask="000-000-00-00"
      definitions={{
        '0': /[0-9]/,
      }}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

// NIP Validator Component
function NIPValidator({ 
  value, 
  onChange, 
  error, 
  helperText, 
  onValidationComplete,
  showCompanyInfo = true,
  ...props 
}) {
  const [validationState, setValidationState] = useState({
    isValid: null,
    isChecking: false,
    message: '',
    companyData: null
  });

  // Mock company database - in real app this would call government API
  const mockCompanyDatabase = {
    '1234567890': {
      name: 'SuperParkiet Sp. z o.o.',
      address: 'ul. Przykładowa 123, 00-001 Warszawa',
      status: 'ACTIVE'
    },
    '9876543210': {
      name: 'Podłogi Premium S.A.',
      address: 'ul. Dębowa 45, 30-001 Kraków',
      status: 'ACTIVE'
    }
  };

  const checkNIPInDatabase = async (nip) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cleanNip = nip.replace(/\D/g, '');
    return mockCompanyDatabase[cleanNip] || null;
  };

  const validateNIPNumber = async (nip) => {
    if (!nip || nip.length < 13) {
      setValidationState({ 
        isValid: null, 
        isChecking: false, 
        message: '',
        companyData: null 
      });
      if (onValidationComplete) {
        onValidationComplete({ isValid: null, companyData: null });
      }
      return;
    }

    setValidationState({ 
      isValid: null, 
      isChecking: true, 
      message: 'Sprawdzam NIP...',
      companyData: null 
    });

    try {
      // First validate NIP format and checksum
      const isValidFormat = validateNIP(nip);
      
      if (isValidFormat) {
        // Check against database if format is valid
        if (showCompanyInfo) {
          const companyData = await checkNIPInDatabase(nip);
          
          if (companyData) {
            setValidationState({
              isValid: true,
              isChecking: false,
              message: `Firma: ${companyData.name}`,
              companyData
            });
            
            if (onValidationComplete) {
              onValidationComplete({ isValid: true, companyData });
            }
          } else {
            setValidationState({
              isValid: true,
              isChecking: false,
              message: 'NIP poprawny (brak danych w bazie)',
              companyData: null
            });
            
            if (onValidationComplete) {
              onValidationComplete({ isValid: true, companyData: null });
            }
          }
        } else {
          setValidationState({
            isValid: true,
            isChecking: false,
            message: 'NIP poprawny',
            companyData: null
          });
          
          if (onValidationComplete) {
            onValidationComplete({ isValid: true, companyData: null });
          }
        }
      } else {
        setValidationState({
          isValid: false,
          isChecking: false,
          message: 'Nieprawidłowy format NIP',
          companyData: null
        });
        
        if (onValidationComplete) {
          onValidationComplete({ isValid: false, companyData: null });
        }
      }
    } catch (error) {
      setValidationState({
        isValid: false,
        isChecking: false,
        message: 'Błąd sprawdzania NIP',
        companyData: null
      });
      
      if (onValidationComplete) {
        onValidationComplete({ isValid: false, companyData: null });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => validateNIPNumber(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <Box>
      <TextField
        {...props}
        value={value}
        onChange={onChange}
        error={error || validationState.isValid === false}
        helperText={
          helperText || 
          validationState.message || 
          (validationState.isChecking ? 'Sprawdzam...' : '')
        }
        InputProps={{
          ...props.InputProps,
          inputComponent: NIPInputMask,
          endAdornment: (
            <InputAdornment position="end">
              {validationState.isChecking && <CircularProgress size={16} />}
              {validationState.isValid === true && <CheckCircleIcon color="success" />}
              {validationState.isValid === false && <ErrorIcon color="error" />}
            </InputAdornment>
          )
        }}
      />
      
      {/* Company Information Display */}
      {showCompanyInfo && validationState.companyData && (
        <Alert 
          severity="info" 
          sx={{ mt: 1 }}
          icon={<BusinessIcon />}
        >
          <Typography variant="body2" fontWeight="medium">
            {validationState.companyData.name}
          </Typography>
          <Typography variant="caption" display="block">
            {validationState.companyData.address}
          </Typography>
          <Typography variant="caption" display="block" color="success.main">
            Status: {validationState.companyData.status === 'ACTIVE' ? 'Aktywny' : 'Nieaktywny'}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

// REGON Input Mask Component
const REGONInputMask = forwardRef(function REGONInputMask(props, ref) {
  const { onChange, ...other } = props;
  
  return (
    <IMaskInput
      {...other}
      mask={[
        {
          mask: '000000000',
          lazy: true
        },
        {
          mask: '00000000000000',
          lazy: true
        }
      ]}
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
    />
  );
});

// REGON Validator Component
function REGONValidator({ value, onChange, error, helperText, ...props }) {
  const [isValid, setIsValid] = useState(null);

  const validateREGON = (regon) => {
    if (!regon) return null;
    
    const cleanRegon = regon.replace(/\D/g, '');
    
    // REGON must be 9 or 14 digits
    if (cleanRegon.length !== 9 && cleanRegon.length !== 14) {
      return false;
    }

    // Basic REGON validation (simplified)
    // In real app, use proper REGON validation algorithm
    return cleanRegon.length === 9 || cleanRegon.length === 14;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValid(validateREGON(value));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <TextField
      {...props}
      value={value}
      onChange={onChange}
      error={error || isValid === false}
      helperText={
        helperText || 
        (isValid === false ? 'Nieprawidłowy format REGON' : '') ||
        (isValid === true ? 'REGON poprawny' : '')
      }
      InputProps={{
        ...props.InputProps,
        inputComponent: REGONInputMask,
        endAdornment: (
          <InputAdornment position="end">
            {isValid === true && <CheckCircleIcon color="success" />}
            {isValid === false && <ErrorIcon color="error" />}
          </InputAdornment>
        )
      }}
    />
  );
}

// Polish Address Input with Autocomplete
function PolishAddressInput({ value, onChange, voivodeships, ...props }) {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Polish voivodeships
  const defaultVoivodeships = [
    'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
    'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
    'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
    'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
  ];

  const searchAddresses = async (query) => {
    if (query.length < 3) return;
    
    setIsLoading(true);
    try {
      // Mock address search - in real app, integrate with Polish postal service API
      const mockSuggestions = [
        {
          street: 'ul. Przykładowa',
          number: '123',
          postalCode: '00-001',
          city: 'Warszawa',
          voivodeship: 'mazowieckie'
        },
        {
          street: 'ul. Dębowa',
          number: '45',
          postalCode: '30-001',
          city: 'Kraków',
          voivodeship: 'małopolskie'
        }
      ].filter(addr => 
        addr.street.toLowerCase().includes(query.toLowerCase()) ||
        addr.city.toLowerCase().includes(query.toLowerCase())
      );
      
      setAddressSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (address) => {
    if (address && typeof address === 'object') {
      const formattedAddress = `${address.street} ${address.number}\n${address.postalCode} ${address.city}`;
      onChange({ target: { value: formattedAddress } });
      setAddressSuggestions([]);
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={addressSuggestions}
      getOptionLabel={(option) => 
        typeof option === 'string' ? option : `${option.street} ${option.number}, ${option.city}`
      }
      onInputChange={(event, newValue) => {
        onChange({ target: { value: newValue } });
        searchAddresses(newValue);
      }}
      onChange={(event, newValue) => {
        handleAddressSelect(newValue);
      }}
      loading={isLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          {...props}
          multiline
          rows={2}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading && <CircularProgress size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box>
            <Typography variant="body2">
              {option.street} {option.number}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {option.postalCode} {option.city}, {option.voivodeship}
            </Typography>
          </Box>
        </Box>
      )}
    />
  );
}

// Export all components
export {
  NIPValidator,
  REGONValidator,
  PolishAddressInput,
  NIPInputMask,
  REGONInputMask
};