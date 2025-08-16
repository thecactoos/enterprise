# Material UI Components - Advanced Pricing System Implementation

## Overview
Detailed Material UI component implementations for the advanced pricing management system, optimized for Polish business context with responsive design and accessibility compliance.

## 1. Core Layout Components

### PricingDashboardLayout
```typescript
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Breadcrumbs,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  }
}));

const PricingDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <StyledContainer maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/">
            Dashboard
          </Link>
          <Typography color="text.primary">Zarządzanie Cenami</Typography>
        </Breadcrumbs>
        
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Zarządzanie Cenami
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Kompleksowe zarządzanie cenami produktów, usług i generowanie ofert
        </Typography>
      </Box>
      
      {children}
    </StyledContainer>
  );
};
```

### ResponsiveGrid Component
```typescript
import { Grid, GridProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ResponsiveGridProps extends GridProps {
  mobileOrder?: number;
  tabletSpacing?: number;
}

const StyledGrid = styled(Grid, {
  shouldForwardProp: (prop) => prop !== 'mobileOrder' && prop !== 'tabletSpacing'
})<ResponsiveGridProps>(({ theme, mobileOrder, tabletSpacing }) => ({
  [theme.breakpoints.down('md')]: {
    order: mobileOrder || 0,
  },
  [theme.breakpoints.between('md', 'lg')]: {
    padding: theme.spacing(tabletSpacing || 2),
  }
}));

const ResponsiveGrid: React.FC<ResponsiveGridProps> = (props) => {
  return <StyledGrid {...props} />;
};
```

## 2. Pricing Display Components

### PriceDisplay Component
```typescript
import { 
  Typography, 
  Box, 
  Chip, 
  Tooltip,
  IconButton 
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon 
} from '@mui/icons-material';

interface PriceDisplayProps {
  price: number;
  previousPrice?: number;
  currency?: string;
  variant?: 'standard' | 'large' | 'compact';
  showTrend?: boolean;
  showVAT?: boolean;
  vatRate?: number;
  tooltip?: string;
}

const formatPolishCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  previousPrice,
  currency = 'PLN',
  variant = 'standard',
  showTrend = false,
  showVAT = false,
  vatRate = 23,
  tooltip
}) => {
  const netPrice = price;
  const vatAmount = showVAT ? (netPrice * vatRate) / 100 : 0;
  const grossPrice = netPrice + vatAmount;
  
  const priceChange = previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;
  const isIncrease = priceChange > 0;
  const isDecrease = priceChange < 0;
  
  const getTypographyVariant = () => {
    switch (variant) {
      case 'large': return 'h4';
      case 'compact': return 'body2';
      default: return 'h6';
    }
  };
  
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography 
            variant={getTypographyVariant()} 
            component="span"
            fontWeight="medium"
            color="primary"
          >
            {formatPolishCurrency(showVAT ? grossPrice : netPrice)}
          </Typography>
          
          {tooltip && (
            <Tooltip title={tooltip}>
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {showVAT && (
          <Typography variant="caption" color="text.secondary">
            Netto: {formatPolishCurrency(netPrice)} + VAT: {formatPolishCurrency(vatAmount)}
          </Typography>
        )}
        
        {showTrend && previousPrice && Math.abs(priceChange) > 0.01 && (
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            {isIncrease && <TrendingUpIcon fontSize="small" color="success" />}
            {isDecrease && <TrendingDownIcon fontSize="small" color="error" />}
            <Chip
              label={`${isIncrease ? '+' : ''}${priceChange.toFixed(1)}%`}
              size="small"
              color={isIncrease ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};
```

### PricingTierCard Component
```typescript
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Calculator as CalculatorIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

interface PricingTier {
  id: string;
  name: string;
  level: 'basic' | 'standard' | 'premium';
  pricePerUnit: number;
  minimumCharge: number;
  features: string[];
  isRecommended?: boolean;
  isPopular?: boolean;
}

interface PricingTierCardProps {
  tier: PricingTier;
  selected?: boolean;
  onSelect?: (tier: PricingTier) => void;
  onEdit?: (tier: PricingTier) => void;
  onCalculate?: (tier: PricingTier) => void;
  showActions?: boolean;
}

const tierColors = {
  basic: '#2196f3',
  standard: '#ff9800', 
  premium: '#9c27b0'
};

const PricingTierCard: React.FC<PricingTierCardProps> = ({
  tier,
  selected = false,
  onSelect,
  onEdit,
  onCalculate,
  showActions = true
}) => {
  const tierColor = tierColors[tier.level];
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: onSelect ? 'translateY(-2px)' : 'none',
          boxShadow: onSelect ? 4 : 1
        }
      }}
      onClick={() => onSelect?.(tier)}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: tierColor }}>
              {tier.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" textTransform="uppercase">
              {tier.level}
            </Typography>
          </Box>
          
          <Box display="flex" gap={0.5}>
            {tier.isRecommended && (
              <Chip 
                label="Polecany" 
                size="small" 
                color="success" 
                variant="outlined"
              />
            )}
            {tier.isPopular && (
              <Chip 
                label="Popularny" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        {/* Pricing */}
        <Box mb={2}>
          <PriceDisplay 
            price={tier.pricePerUnit}
            variant="large"
            tooltip="Cena za metr kwadratowy"
          />
          <Typography variant="body2" color="text.secondary">
            za m² • Min. koszt: {formatPolishCurrency(tier.minimumCharge)}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Features */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Cechy pakietu:
          </Typography>
          <Stack spacing={0.5}>
            {tier.features.slice(0, 3).map((feature, index) => (
              <Typography key={index} variant="body2" color="text.secondary">
                • {feature}
              </Typography>
            ))}
            {tier.features.length > 3 && (
              <Typography variant="body2" color="primary">
                + {tier.features.length - 3} więcej funkcji
              </Typography>
            )}
          </Stack>
        </Box>
      </CardContent>
      
      {showActions && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(tier);
            }}
          >
            Edytuj
          </Button>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCalculate?.(tier);
            }}
            title="Kalkulator cen"
          >
            <CalculatorIcon />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};
```

## 3. Form Components

### PriceInputField Component
```typescript
import {
  TextField,
  InputAdornment,
  FormHelperText,
  Box,
  Typography
} from '@mui/material';
import { useState, useEffect } from 'react';

interface PriceInputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  precision?: number;
  showGrossAmount?: boolean;
  vatRate?: number;
}

const PriceInputField: React.FC<PriceInputFieldProps> = ({
  label,
  value,
  onChange,
  currency = 'PLN',
  error = false,
  helperText,
  required = false,
  disabled = false,
  min = 0,
  max,
  precision = 2,
  showGrossAmount = false,
  vatRate = 23
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [focused, setFocused] = useState(false);
  
  useEffect(() => {
    if (!focused) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      setDisplayValue(isNaN(numValue) ? '' : numValue.toFixed(precision));
    }
  }, [value, focused, precision]);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setDisplayValue(inputValue);
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= min && (!max || numValue <= max)) {
      onChange(numValue);
    }
  };
  
  const handleBlur = () => {
    setFocused(false);
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toFixed(precision));
    }
  };
  
  const grossAmount = showGrossAmount && !isNaN(parseFloat(displayValue)) 
    ? parseFloat(displayValue) * (1 + vatRate / 100)
    : 0;
  
  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        error={error}
        required={required}
        disabled={disabled}
        inputProps={{
          inputMode: 'decimal',
          pattern: '[0-9]*[.,]?[0-9]*',
          step: Math.pow(10, -precision),
          min,
          max
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Typography variant="body2" color="text.secondary">
                {currency}
              </Typography>
            </InputAdornment>
          )
        }}
      />
      
      {showGrossAmount && grossAmount > 0 && (
        <FormHelperText>
          Brutto (z VAT {vatRate}%): {formatPolishCurrency(grossAmount)}
        </FormHelperText>
      )}
      
      {helperText && (
        <FormHelperText error={error}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};
```

### QuantitySelector Component
```typescript
import {
  Box,
  IconButton,
  TextField,
  Typography,
  ButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  precision?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 0.01,
  max = 9999,
  step = 1,
  unit = 'szt',
  size = 'medium',
  disabled = false,
  precision = 2
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(parseFloat(newValue.toFixed(precision)));
  };
  
  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(parseFloat(newValue.toFixed(precision)));
  };
  
  const handleDirectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(event.target.value);
    if (!isNaN(inputValue) && inputValue >= min && inputValue <= max) {
      onChange(parseFloat(inputValue.toFixed(precision)));
    }
  };
  
  const buttonSize = size === 'small' ? 'small' : 'medium';
  const textFieldSize = size === 'large' ? 'medium' : size;
  
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      <ButtonGroup variant="outlined" size={buttonSize} disabled={disabled}>
        <IconButton
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          size={buttonSize}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        
        <TextField
          size={textFieldSize}
          value={value.toFixed(precision)}
          onChange={handleDirectChange}
          disabled={disabled}
          inputProps={{
            style: { 
              textAlign: 'center', 
              width: size === 'small' ? '50px' : '70px',
              padding: size === 'small' ? '4px' : '8px'
            },
            min,
            max,
            step,
            type: 'number'
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: 0
              }
            }
          }}
        />
        
        <IconButton
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          size={buttonSize}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </ButtonGroup>
      
      <Typography 
        variant={size === 'small' ? 'caption' : 'body2'} 
        color="text.secondary"
        textAlign="center"
      >
        {unit}
      </Typography>
    </Box>
  );
};
```

## 4. Data Display Components

### PricingTable Component
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  Calculator as CalculatorIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useState } from 'react';

interface PricingTableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
  sortable?: boolean;
}

interface PricingTableRow {
  id: string;
  [key: string]: any;
}

interface PricingTableProps {
  columns: PricingTableColumn[];
  rows: PricingTableRow[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onRowSelect?: (selectedIds: string[]) => void;
  onRowAction?: (action: string, row: PricingTableRow) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  pagination?: {
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
  };
}

const PricingTable: React.FC<PricingTableProps> = ({
  columns,
  rows,
  loading = false,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onRowAction,
  sortBy,
  sortDirection = 'asc',
  onSort,
  pagination
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onRowSelect?.(rows.map(row => row.id));
    } else {
      onRowSelect?.([]);
    }
  };
  
  const handleSelectRow = (rowId: string) => {
    const newSelection = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    onRowSelect?.(newSelection);
  };
  
  const handleSort = (column: PricingTableColumn) => {
    if (!column.sortable || !onSort) return;
    
    const isAsc = sortBy === column.id && sortDirection === 'asc';
    onSort(column.id, isAsc ? 'desc' : 'asc');
  };
  
  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && <TableCell padding="checkbox" />}
              {columns.map((column) => (
                <TableCell key={column.id}>
                  <Skeleton width="100%" />
                </TableCell>
              ))}
              <TableCell>Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                {selectable && <TableCell padding="checkbox" />}
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton />
                  </TableCell>
                ))}
                <TableCell>
                  <Skeleton width={100} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  
  return (
    <Paper>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < rows.length}
                    checked={rows.length > 0 && selectedRows.length === rows.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              
              <TableCell align="center">Akcje</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {rows.map((row) => (
              <TableRow 
                key={row.id}
                hover
                selected={selectedRows.includes(row.id)}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                    />
                  </TableCell>
                )}
                
                {columns.map((column) => {
                  const value = row[column.id];
                  const displayValue = column.format ? column.format(value) : value;
                  
                  return (
                    <TableCell key={column.id} align={column.align}>
                      {column.id === 'status' ? (
                        <Chip 
                          label={displayValue}
                          size="small"
                          color={value === 'active' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      ) : (
                        displayValue
                      )}
                    </TableCell>
                  );
                })}
                
                <TableCell align="center">
                  <Box display="flex" gap={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => onRowAction?.('view', row)}
                      title="Zobacz szczegóły"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => onRowAction?.('edit', row)}
                      title="Edytuj"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => onRowAction?.('calculate', row)}
                      title="Kalkulator"
                    >
                      <CalculatorIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(_, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(event) => 
            pagination.onRowsPerPageChange(parseInt(event.target.value, 10))
          }
          labelRowsPerPage="Wierszy na stronę:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} z ${count !== -1 ? count : `więcej niż ${to}`}`
          }
        />
      )}
    </Paper>
  );
};
```

## 5. Polish Localization Components

### PolishDatePicker Component
```typescript
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { pl } from 'date-fns/locale';
import { TextField } from '@mui/material';

interface PolishDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const PolishDatePicker: React.FC<PolishDatePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  minDate,
  maxDate
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            required={required}
            error={error}
            helperText={helperText}
            inputProps={{
              ...params.inputProps,
              placeholder: 'dd.mm.rrrr'
            }}
          />
        )}
        inputFormat="dd.MM.yyyy"
        mask="__.__.____"
        OpenPickerButtonProps={{
          'aria-label': 'Wybierz datę'
        }}
      />
    </LocalizationProvider>
  );
};
```

### PolishCurrencyFormat Hook
```typescript
import { useMemo } from 'react';

interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export const usePolishCurrencyFormat = (options: CurrencyFormatOptions = {}) => {
  const formatter = useMemo(() => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
      useGrouping: options.useGrouping ?? true
    });
  }, [options]);
  
  const formatCurrency = (amount: number): string => {
    return formatter.format(amount);
  };
  
  const parseCurrency = (formatted: string): number => {
    // Remove currency symbol and spaces, replace comma with dot
    const cleaned = formatted
      .replace(/[^\d,.-]/g, '') // Keep only digits, comma, dot, minus
      .replace(',', '.'); // Replace comma with dot for parsing
    
    return parseFloat(cleaned) || 0;
  };
  
  const formatInputValue = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    
    // Format for input (without currency symbol)
    return numValue.toLocaleString('pl-PL', {
      minimumFractionDigits: options.minimumFractionDigits ?? 2,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
      useGrouping: options.useGrouping ?? true
    });
  };
  
  return {
    formatCurrency,
    parseCurrency,
    formatInputValue,
    formatter
  };
};
```

## 6. Responsive Design Components

### MobileOptimizedCard Component
```typescript
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useState } from 'react';

interface MobileOptimizedCardProps {
  title: string;
  subtitle?: string;
  primaryContent: React.ReactNode;
  expandedContent?: React.ReactNode;
  actions?: React.ReactNode;
  defaultExpanded?: boolean;
}

const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  subtitle,
  primaryContent,
  expandedContent,
  actions,
  defaultExpanded = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  if (!isMobile) {
    // Desktop: show all content
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {subtitle}
            </Typography>
          )}
          {primaryContent}
          {expandedContent}
        </CardContent>
        {actions && <CardActions>{actions}</CardActions>}
      </Card>
    );
  }
  
  // Mobile: collapsible content
  return (
    <Card>
      <CardContent sx={{ pb: expandedContent ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {subtitle}
              </Typography>
            )}
          </Box>
          
          {expandedContent && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Zwiń' : 'Rozwiń'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
        
        {primaryContent}
        
        {expandedContent && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box mt={2}>
              {expandedContent}
            </Box>
          </Collapse>
        )}
      </CardContent>
      
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  );
};
```

### ResponsiveDialog Component
```typescript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Slide,
  Paper
} from '@mui/material';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidthMobile?: boolean;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidthMobile = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile && fullWidthMobile}
      TransitionComponent={isMobile ? Transition : undefined}
      PaperProps={{
        sx: {
          ...(isMobile && fullWidthMobile && {
            m: 0,
            borderRadius: 0
          })
        }
      }}
    >
      {title && (
        <DialogTitle sx={{ pb: 1 }}>
          {title}
        </DialogTitle>
      )}
      
      <DialogContent dividers={!!title || !!actions}>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};
```

## 7. Accessibility Features

### Screen Reader Optimizations
```typescript
// ARIA labels and descriptions for Polish users
export const polishAriaLabels = {
  priceInput: 'Wprowadź cenę w złotych polskich',
  quantityInput: 'Wprowadź ilość',
  dateInput: 'Wybierz datę w formacie dzień.miesiąc.rok',
  currencySymbol: 'złoty polski',
  increaseQuantity: 'Zwiększ ilość',
  decreaseQuantity: 'Zmniejsz ilość',
  selectAll: 'Zaznacz wszystkie pozycje',
  sortAscending: 'Sortuj rosnąco',
  sortDescending: 'Sortuj malejąco',
  required: 'pole wymagane',
  invalid: 'nieprawidłowa wartość',
  loading: 'ładowanie danych',
  success: 'operacja zakończona pomyślnie',
  error: 'wystąpił błąd'
};

// High contrast mode support
export const useHighContrastMode = () => {
  const [highContrast, setHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return highContrast;
};
```

This comprehensive Material UI component library provides a solid foundation for implementing the advanced pricing management system with Polish business context, responsive design, and accessibility compliance.