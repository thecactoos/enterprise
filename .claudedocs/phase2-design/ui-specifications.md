# UI Specifications - Advanced Pricing Management System

## Overview
Comprehensive UI specifications for the Polish Construction CRM advanced pricing management system, designed for Material UI React frontend with Polish business context.

## Polish Business Context Requirements
- **Currency**: All prices in PLN (Polish Złoty) with comma decimal separator (45,50 PLN)
- **VAT Integration**: Standard 23% VAT rate display and calculations
- **NIP/REGON Fields**: Polish business tax number validation
- **Language**: Polish labels, messages, and validation text
- **Date Format**: DD.MM.YYYY (Polish standard)
- **Number Format**: 1 234,56 (space thousands separator, comma decimal)

## 1. Pricing Management Dashboard

### Layout Structure
```
┌─ Navbar (existing) ────────────────────────────────────────┐
├─ Breadcrumbs ─────────────────────────────────────────────┤
├─ Dashboard Header ────────────────────────────────────────┤
│  • Title: "Zarządzanie Cenami"                             │
│  • Subtitle: "Usługi, produkty i generowanie ofert"       │
│  • Quick Actions: [Nowa Oferta] [Aktualizuj Ceny]        │
├─ Main Content Grid (12 columns) ─────────────────────────┤
│  ┌─ Left Panel (8 cols) ──┐  ┌─ Right Panel (4 cols) ─┐   │
│  │ • Services Pricing     │  │ • Quick Stats         │   │
│  │ • Products Overview    │  │ • Recent Activity     │   │
│  │ • Bulk Operations      │  │ • Price Alerts       │   │
│  └────────────────────────┘  └───────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Header Component Specifications
- **Container**: Material UI `Container maxWidth="lg"`
- **Typography**: `h4` for main title, `body1 color="textSecondary"` for subtitle
- **Action Buttons**: `Button variant="contained"` with appropriate icons
- **Spacing**: `mb: 4` for header section

### Quick Stats Cards
```typescript
interface PricingStats {
  totalServices: number;
  activeProducts: number;
  pendingQuotes: number;
  avgMargin: number;
  lastUpdated: Date;
}
```

**Card Layout**:
- Material UI `Paper elevation={3}`
- Grid layout: 2x2 for desktop, 1x4 for mobile
- Icons: ServiceIcon, ProductIcon, QuoteIcon, TrendingUpIcon
- Color coding: Primary, Secondary, Success, Warning

## 2. Service Pricing Tiers Interface

### Service Tier Management Panel
```
┌─ Service Pricing Tiers ──────────────────────────────────┐
├─ Tier Selector Tabs ────────────────────────────────────┤
│  [Podstawowy] [Standardowy] [Premium] [Wszystkie]        │
├─ Service Grid ──────────────────────────────────────────┤
│  ┌─ Service Card ────────────────────────────────────┐   │
│  │ 🪵 Montaż podłogi drewnianej na klej             │   │
│  │ Kategoria: Drewno • Klej • Parkiet               │   │
│  │ ┌─ Pricing Tiers ─────────────────────────────┐   │   │
│  │ │ Podstawowy: 35,50 PLN/m²                    │   │   │
│  │ │ Standardowy: 45,50 PLN/m² (wybrany)        │   │   │
│  │ │ Premium: 55,50 PLN/m²                       │   │   │
│  │ └─────────────────────────────────────────────┘   │   │
│  │ [Edytuj Ceny] [Kalkulator] [Szczegóły]           │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Service Card Component
- **Container**: Material UI `Card` with `CardContent`
- **Header**: Service name with emoji, category chips
- **Pricing Display**: 
  - Three-tier pricing with clear visual hierarchy
  - Current/selected tier highlighted with `Chip color="primary"`
  - Polish currency formatting with `toLocaleString('pl-PL')`
- **Actions**: `ButtonGroup variant="outlined"` with edit, calculator, details

### Service Pricing Form Modal
```
┌─ Dialog: Edytuj Ceny Usługi ─────────────────────────────┐
├─ Service Info Header ───────────────────────────────────┤
│  Icon + Name + Current Status                            │
├─ Pricing Tiers Form ────────────────────────────────────┤
│  ┌─ Podstawowy ─────────────────────────────────────────┐ │
│  │ Cena bazowa: [35,50] PLN/m²                         │ │
│  │ Minimalny koszt: [200,00] PLN                       │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Standardowy ────────────────────────────────────────┐ │
│  │ Cena: [45,50] PLN/m²                                │ │
│  │ Marża: [+28,6%] (auto-calculated)                   │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Premium ────────────────────────────────────────────┐ │
│  │ Cena: [55,50] PLN/m²                                │ │
│  │ Marża: [+57,1%] (auto-calculated)                   │ │
│  └─────────────────────────────────────────────────────┘ │
├─ Advanced Settings ─────────────────────────────────────┤
│  • VAT Rate: [23%] dropdown                             │
│  • Volume Discount: [10%] at [50] m²                    │
│  • Regional Multiplier: [1,15] (Warsaw: +15%)           │
│  • Seasonal Adjustment: [✓] Active [1,1] multiplier     │
├─ Preview Calculation ───────────────────────────────────┤
│  Test: [25] m² → Standardowy                            │
│  Netto: 1 137,50 PLN | VAT: 261,63 PLN | Brutto: 1 399,13 PLN │
└─ Actions: [Anuluj] [Zapisz Zmiany] ────────────────────┘
```

## 3. Product Margin Calculator Interface

### Product Pricing Overview
```
┌─ Zarządzanie Cenami Produktów ───────────────────────────┐
├─ Search & Filter Bar ───────────────────────────────────┤
│  🔍 [Search products...] [Category ▼] [Status ▼] [Clear] │
├─ Bulk Actions Bar ──────────────────────────────────────┤
│  ☐ Select All | Selected: 0 | [Update Prices] [Export]  │
├─ Product Table ─────────────────────────────────────────┤
│  ☐ │ Kod    │ Nazwa Produktu        │ Kategoria │ Marża  │ Akcje │
│  ☐ │ FL001  │ Deska podłogowa...    │ Flooring  │ 28,5%  │ [⚙️📊] │
│  ☐ │ ML002  │ Listwa MDF...         │ Molding   │ 15,2%  │ [⚙️📊] │
│  ☐ │ AC003  │ Podkład...           │ Accessory │ 45,8%  │ [⚙️📊] │
└───────────────────────────────────────────────────────────┘
```

### Product Margin Calculator Modal
```
┌─ Dialog: Kalkulator Marży - FL001 ──────────────────────┐
├─ Product Header ────────────────────────────────────────┤
│  📦 FL001 | Deska podłogowa dębowa 14x120x1200mm        │
│  Status: [Active ▼] | Kategoria: Flooring              │
├─ Current Pricing ───────────────────────────────────────┤
│  ┌─ Ceny Zakupu ────────────────────────────────────────┐ │
│  │ Dostawca: [Supplier A ▼]                            │ │
│  │ Cena zakupu: [25,50] PLN/m²                         │ │
│  │ Waluta: [PLN ▼] | Data: [2024-08-01]                │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Pricing Calculator ────────────────────────────────┐ │
│  │ Target Margin: [28,5]% or [32,75] PLN               │ │
│  │ ├─ Calculation Mode: [⚪ Percentage] [⚫ Fixed PLN]  │ │
│  │ ├─ Selling Price: [32,75] PLN/m² (auto-calculated) │ │
│  │ ├─ Retail Price: [45,85] PLN/m² (+40% markup)     │ │
│  │ └─ Installation Fee: [5,2]% = [1,70] PLN/m²       │ │
│  └─────────────────────────────────────────────────────┘ │
├─ Bulk Pricing Rules ────────────────────────────────────┤
│  Volume tiers: [50+] m² = [-5%] | [100+] m² = [-8%]    │
├─ Competition Analysis ──────────────────────────────────┤
│  Market Range: 30,00 - 42,00 PLN/m²                    │
│  Your Position: [████▓▓▓▓▓▓] Średnio-wysoka             │
├─ Preview Results ───────────────────────────────────────┤
│  Test quantity: [25] m²                                 │
│  Customer pays: 818,75 PLN (netto) + 188,31 PLN (VAT)  │
│  Your profit: 181,25 PLN (28,5% margin)                │
└─ Actions: [Cancel] [Save Changes] [Apply to Similar] ──┘
```

## 4. Bulk Price Update Interface

### Bulk Operations Panel
```
┌─ Masowe Aktualizacje Cen ────────────────────────────────┐
├─ Selection Criteria ────────────────────────────────────┤
│  ┌─ Products ──────────────────────────────────────────┐ │
│  │ Category: [All ▼] | Status: [Active ▼]              │ │
│  │ Supplier: [All ▼] | Date Range: [Last 30 days ▼]   │ │
│  │ Price Range: [0] - [1000] PLN                       │ │
│  │ [Apply Filters] → Found: 1,245 products            │ │
│  └─────────────────────────────────────────────────────┘ │
├─ Update Rules ──────────────────────────────────────────┤
│  ┌─ Pricing Strategy ──────────────────────────────────┐ │
│  │ [⚫ Percentage] [⚪ Fixed Amount] [⚪ New Margin]     │ │
│  │ Adjustment: [+5]% to selling prices                 │ │
│  │ ├─ Apply to: [✓] Selling [✓] Retail [✗] Purchase   │ │
│  │ ├─ Round to: [0,05] PLN (nearest 5 groszy)         │ │
│  │ └─ Effective Date: [2024-08-15] [⚪ Immediate]      │ │
│  └─────────────────────────────────────────────────────┘ │
├─ Preview Changes ───────────────────────────────────────┤
│  Showing 5 of 1,245 products:                          │
│  FL001: 32,75 PLN → 34,40 PLN (+5,0%)                  │
│  ML002: 18,90 PLN → 19,85 PLN (+5,0%)                  │
│  AC003: 12,50 PLN → 13,15 PLN (+5,2% rounded)          │
│  [Show All] [Export Preview]                           │
├─ Validation Results ────────────────────────────────────┤
│  ✅ All prices within margin limits (15-50%)            │
│  ⚠️  12 products will exceed max retail price           │
│  ✅ No conflicts with existing promotions               │
└─ Actions: [Cancel] [Schedule Update] [Apply Now] ──────┘
```

### Bulk Update Progress Modal
```
┌─ Aktualizowanie Cen... ──────────────────────────────────┐
├─ Progress Status ───────────────────────────────────────┤
│  Processing products: ████████████░░░░░░░░ 67% (834/1245) │
│  ┌─ Current Operation ─────────────────────────────────┐ │
│  │ Updating FL1205: Deska dębowa premium...            │ │
│  │ Old price: 45,50 PLN → New price: 47,78 PLN        │ │
│  │ Estimated time remaining: 2 min 15 sec              │ │
│  └─────────────────────────────────────────────────────┘ │
├─ Results Summary ───────────────────────────────────────┤
│  ✅ Successfully updated: 834 products                  │
│  ⚠️  Warnings: 12 products (see details)               │
│  ❌ Failed: 0 products                                  │
├─ Real-time Log ─────────────────────────────────────────┤
│  12:45:32 - Updated FL1205 pricing tiers               │
│  12:45:31 - Applied margin calculation to ML0089       │
│  12:45:30 - Validated AC0156 price ranges              │
│  [Show Full Log]                                       │
└─ Actions: [Background] [View Results] [Cancel] ────────┘
```

## 5. Polish Currency Formatting Specifications

### Number Formatting Rules
```typescript
interface PolishCurrencyFormat {
  decimal: ',';           // Comma as decimal separator
  thousands: ' ';         // Space as thousands separator  
  symbol: 'PLN';          // Currency symbol
  precision: 2;           // 2 decimal places
  position: 'after';      // Symbol after amount
  template: '1 234,56 PLN';
}

// Implementation
const formatPLN = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Examples:
// 1234.56 → "1 234,56 PLN"
// 45.5 → "45,50 PLN"
// 1000000 → "1 000 000,00 PLN"
```

### Input Field Specifications
- **Price Input Fields**: 
  - Material UI `TextField` with `InputAdornment` showing "PLN"
  - Number input with Polish locale formatting
  - Validation for positive values only
  - Helper text showing formatted preview

- **Percentage Fields**:
  - Suffix with "%" symbol
  - Range validation (0-100% for most cases)
  - Real-time calculation display

- **Date Fields**:
  - Material UI `DatePicker` with Polish locale
  - Format: DD.MM.YYYY
  - Calendar in Polish language

## 6. Responsive Design Specifications

### Desktop Layout (≥1200px)
- 12-column Material UI Grid system
- Full feature visibility
- Side-by-side forms and previews
- Expanded data tables with all columns

### Tablet Layout (768px - 1199px)
- Collapse to 8-column grid
- Stack forms vertically
- Hide non-essential table columns
- Compact card layouts

### Mobile Layout (<768px)
- Single column layout
- Full-width components
- Collapsible sections with accordions
- Bottom sheet modals for complex forms
- Swipe gestures for table scrolling
- Floating Action Button for primary actions

### Material UI Breakpoints
```typescript
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

// Responsive styling patterns
const useStyles = makeStyles((theme) => ({
  priceCard: {
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
}));
```

## 7. Color System and Visual Hierarchy

### Polish Business Color Palette
```css
:root {
  /* Primary Brand Colors */
  --primary-main: #1976d2;      /* Professional blue */
  --primary-light: #42a5f5;     /* Light blue accents */
  --primary-dark: #0d47a1;      /* Dark blue headers */
  
  /* Success/Profit Colors */
  --success-main: #2e7d32;      /* Profit positive */
  --success-light: #4caf50;     /* Success states */
  
  /* Warning/Alert Colors */
  --warning-main: #f57c00;      /* Price alerts */
  --warning-light: #ff9800;     /* Warning states */
  
  /* Error/Loss Colors */
  --error-main: #d32f2f;        /* Loss/error states */
  --error-light: #f44336;       /* Error highlights */
  
  /* Polish Business Context */
  --vat-color: #7b1fa2;         /* VAT amounts */
  --margin-color: #388e3c;      /* Profit margins */
  --discount-color: #1976d2;    /* Discounts/promotions */
}
```

### Typography Hierarchy
- **Page Headers**: Material UI `Typography variant="h4"` with `fontWeight: 600`
- **Section Headers**: `Typography variant="h6"` with primary color
- **Price Displays**: `Typography variant="h5"` with monospace font for consistency
- **Labels**: `Typography variant="body2"` with `color="textSecondary"`
- **Helper Text**: `Typography variant="caption"` for validation messages

### Visual Feedback Patterns
- **Loading States**: Material UI `Skeleton` components with shimmer effect
- **Success Actions**: Green snackbar with checkmark icon
- **Error States**: Red alert with descriptive error message
- **Form Validation**: Real-time validation with color-coded helper text
- **Price Changes**: Animated number transitions with color indication (green=increase, red=decrease)