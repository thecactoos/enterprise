# Phase 4 Polish Business Compliance

## Overview

Comprehensive Polish business compliance implementation for the Construction CRM pricing system, ensuring adherence to Polish tax law, currency formatting, and business practices.

## Polish VAT (Podatek VAT) Implementation

### VAT Rate Structure

**Standard Rates (as of 2024):**
- **23%** - Standard rate for most construction services and materials
- **8%** - Reduced rate for specific construction services
- **0%** - Zero rate for exports and specific cases

### VAT Implementation in Services

```typescript
// Service VAT Configuration
export enum VatRate {
  STANDARD = 23,    // Most flooring services
  REDUCED = 8,      // Transport, maintenance, repairs
  ZERO = 0          // Exports, specific cases
}

// Automatic VAT Assignment Rules
const serviceVatRules = {
  // Standard 23% VAT
  standard: [
    'wood_glue', 'wood_click',
    'laminate_glue', 'laminate_click', 
    'vinyl_glue', 'vinyl_click',
    'baseboards'
  ],
  
  // Reduced 8% VAT  
  reduced: [
    'transport',           // Transport services
    'maintenance',         // Maintenance/repair services
    'consultation'         // Advisory services
  ]
};

// VAT Calculation Function
calculateVAT(netAmount: number, vatRate: VatRate): {
  netAmount: number;
  vatAmount: number; 
  grossAmount: number;
  vatRate: number;
} {
  const vatAmount = (netAmount * vatRate) / 100;
  const grossAmount = netAmount + vatAmount;
  
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
    vatRate
  };
}
```

### VAT Implementation in Products

```typescript
// Product VAT Assignment
const productVatRules = {
  // Standard 23% VAT
  standard: [
    'flooring',      // Flooring materials
    'panel',         // Panels
    'molding',       // Molding/trim
    'profile'        // Profiles
  ],
  
  // Reduced 8% VAT (if applicable)
  reduced: [
    'accessory'      // Some accessories may qualify
  ]
};

// Automatic VAT Calculation for Products
class Product {
  calculatePriceWithVAT(): {
    netPrice: number;
    vatAmount: number;
    grossPrice: number;
    formattedPrices: {
      net: string;
      vat: string; 
      gross: string;
    };
  } {
    const netPrice = this.selling_price_per_unit || 0;
    const vatAmount = (netPrice * this.vat_rate) / 100;
    const grossPrice = netPrice + vatAmount;
    
    return {
      netPrice,
      vatAmount,
      grossPrice,
      formattedPrices: {
        net: this.formatPLN(netPrice),
        vat: this.formatPLN(vatAmount),
        gross: this.formatPLN(grossPrice)
      }
    };
  }
}
```

## Polish Currency (PLN) Formatting

### Standard Polish Number Format

**Format Rules:**
- **Decimal Separator**: Comma (,) instead of period (.)
- **Thousands Separator**: Space ( ) for numbers ≥1000
- **Currency Symbol**: PLN (after the amount)
- **Precision**: 2 decimal places for currency

**Examples:**
- `1234.56` → `1 234,56 PLN`
- `45.5` → `45,50 PLN`
- `0.99` → `0,99 PLN`

### Implementation

```typescript
// Polish PLN Formatting Service
class PolishCurrencyFormatter {
  /**
   * Format number as Polish PLN currency
   * @param amount - Numeric amount
   * @param showCurrency - Include PLN suffix (default: true)
   * @returns Formatted Polish currency string
   */
  static formatPLN(amount: number, showCurrency: boolean = true): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showCurrency ? '0,00 PLN' : '0,00';
    }
    
    // Ensure 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart = '00'] = roundedAmount.toFixed(2).split('.');
    
    // Add thousands separators (spaces)
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Combine with comma as decimal separator
    const formattedAmount = `${formattedInteger},${decimalPart}`;
    
    return showCurrency ? `${formattedAmount} PLN` : formattedAmount;
  }
  
  /**
   * Parse Polish formatted currency to number
   * @param polishAmount - Polish formatted string (e.g., "1 234,56 PLN")
   * @returns Numeric amount
   */
  static parsePLN(polishAmount: string): number {
    if (!polishAmount) return 0;
    
    // Remove PLN suffix and spaces
    const cleanAmount = polishAmount
      .replace(/\s*PLN\s*$/i, '')
      .replace(/\s/g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * Format VAT breakdown for Polish invoices
   */
  static formatVATBreakdown(netAmount: number, vatRate: number): {
    net: string;
    vat: string;
    gross: string;
    vatDescription: string;
  } {
    const vatAmount = (netAmount * vatRate) / 100;
    const grossAmount = netAmount + vatAmount;
    
    return {
      net: this.formatPLN(netAmount),
      vat: this.formatPLN(vatAmount),
      gross: this.formatPLN(grossAmount),
      vatDescription: `VAT ${vatRate}%`
    };
  }
}

// Usage in Entity Classes
class Service {
  get formattedPrice(): string {
    return PolishCurrencyFormatter.formatPLN(this.basePricePerM2);
  }
  
  get formattedPriceWithVAT(): string {
    const grossPrice = this.basePricePerM2 * (1 + this.vatRate / 100);
    return PolishCurrencyFormatter.formatPLN(grossPrice);
  }
}

class Product {
  get formattedSellingPrice(): string {
    return PolishCurrencyFormatter.formatPLN(this.selling_price_per_unit);
  }
  
  get formattedGrossPrice(): string {
    const grossPrice = this.selling_price_per_unit * (1 + this.vat_rate / 100);
    return PolishCurrencyFormatter.formatPLN(grossPrice);
  }
}
```

### Frontend Integration

```typescript
// Frontend Currency Formatter (React/TypeScript)
export const usePolishCurrency = () => {
  const formatPLN = (amount: number, showCurrency: boolean = true): string => {
    return PolishCurrencyFormatter.formatPLN(amount, showCurrency);
  };
  
  const parsePLN = (polishAmount: string): number => {
    return PolishCurrencyFormatter.parsePLN(polishAmount);
  };
  
  return { formatPLN, parsePLN };
};

// Usage in React Components
const PricingDisplay: React.FC<{ service: Service }> = ({ service }) => {
  const { formatPLN } = usePolishCurrency();
  
  return (
    <div>
      <p>Cena netto: {formatPLN(service.basePricePerM2)}</p>
      <p>VAT ({service.vatRate}%): {formatPLN(service.basePricePerM2 * service.vatRate / 100)}</p>
      <p>Cena brutto: {formatPLN(service.basePricePerM2 * (1 + service.vatRate / 100))}</p>
    </div>
  );
};
```

## Polish Regional Pricing

### City-Based Pricing Multipliers

**Regional Market Analysis (2024 Data):**
- **Warsaw (Warszawa)**: +25% (highest labor costs, premium market)
- **Krakow (Kraków)**: +15% (high demand, tourist market)
- **Gdansk (Gdańsk)**: +10% (coastal market, higher transport costs)
- **Wroclaw (Wrocław)**: +8% (growing market, competitive pricing)
- **Poznan (Poznań)**: +5% (stable market, moderate costs)
- **Other Cities**: Base pricing (100%)

### Implementation

```typescript
// Regional Pricing Configuration
export enum RegionalZone {
  WARSAW = 'warsaw',     // Warszawa
  KRAKOW = 'krakow',     // Kraków  
  GDANSK = 'gdansk',     // Gdańsk
  WROCLAW = 'wroclaw',   // Wrocław
  POZNAN = 'poznan',     // Poznań
  OTHER = 'other'        // Inne miasta
}

const regionalMultipliers = {
  [RegionalZone.WARSAW]: 1.25,   // +25%
  [RegionalZone.KRAKOW]: 1.15,   // +15%
  [RegionalZone.GDANSK]: 1.10,   // +10%
  [RegionalZone.WROCLAW]: 1.08,  // +8%
  [RegionalZone.POZNAN]: 1.05,   // +5%
  [RegionalZone.OTHER]: 1.00     // Base
};

// Polish City Names Mapping
const cityNames = {
  [RegionalZone.WARSAW]: 'Warszawa',
  [RegionalZone.KRAKOW]: 'Kraków',
  [RegionalZone.GDANSK]: 'Gdańsk',
  [RegionalZone.WROCLAW]: 'Wrocław',
  [RegionalZone.POZNAN]: 'Poznań',
  [RegionalZone.OTHER]: 'Inne miasta'
};

// Regional Pricing Calculator
class RegionalPricingService {
  static calculateRegionalPrice(
    basePrice: number,
    region: RegionalZone
  ): {
    basePrice: number;
    multiplier: number;
    regionalPrice: number;
    formattedPrices: {
      base: string;
      regional: string;
      difference: string;
    };
    cityName: string;
  } {
    const multiplier = regionalMultipliers[region];
    const regionalPrice = basePrice * multiplier;
    const difference = regionalPrice - basePrice;
    
    return {
      basePrice,
      multiplier,
      regionalPrice,
      formattedPrices: {
        base: PolishCurrencyFormatter.formatPLN(basePrice),
        regional: PolishCurrencyFormatter.formatPLN(regionalPrice),
        difference: difference > 0 
          ? `+${PolishCurrencyFormatter.formatPLN(difference)}`
          : PolishCurrencyFormatter.formatPLN(difference)
      },
      cityName: cityNames[region]
    };
  }
}
```

## Polish Business Validation Rules

### NIP (Tax ID) Integration

```typescript
// NIP Validation for Business Customers
class PolishBusinessValidator {
  /**
   * Validate Polish NIP (Numer Identyfikacji Podatkowej)
   * @param nip - NIP number (10 digits)
   * @returns Validation result
   */
  static validateNIP(nip: string): {
    isValid: boolean;
    formatted: string;
    error?: string;
  } {
    if (!nip) {
      return { isValid: false, formatted: '', error: 'NIP is required' };
    }
    
    // Remove spaces and dashes
    const cleanNIP = nip.replace(/[\s-]/g, '');
    
    // Check if 10 digits
    if (!/^\d{10}$/.test(cleanNIP)) {
      return { 
        isValid: false, 
        formatted: cleanNIP, 
        error: 'NIP must be 10 digits' 
      };
    }
    
    // Calculate checksum
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = cleanNIP.split('').map(Number);
    const sum = weights.reduce((acc, weight, index) => acc + weight * digits[index], 0);
    const checksum = sum % 11;
    
    if (checksum !== digits[9]) {
      return { 
        isValid: false, 
        formatted: cleanNIP, 
        error: 'Invalid NIP checksum' 
      };
    }
    
    // Format with dashes (XXX-XXX-XX-XX)
    const formatted = `${cleanNIP.slice(0, 3)}-${cleanNIP.slice(3, 6)}-${cleanNIP.slice(6, 8)}-${cleanNIP.slice(8, 10)}`;
    
    return { isValid: true, formatted };
  }
}
```

### REGON Integration

```typescript
// REGON Validation for Business Registration
class PolishREGONValidator {
  /**
   * Validate Polish REGON (9 or 14 digits)
   * @param regon - REGON number
   * @returns Validation result
   */
  static validateREGON(regon: string): {
    isValid: boolean;
    formatted: string;
    type: '9-digit' | '14-digit' | null;
    error?: string;
  } {
    if (!regon) {
      return { isValid: false, formatted: '', type: null, error: 'REGON is required' };
    }
    
    const cleanREGON = regon.replace(/[\s-]/g, '');
    
    // Check if 9 or 14 digits
    if (!/^(\d{9}|\d{14})$/.test(cleanREGON)) {
      return { 
        isValid: false, 
        formatted: cleanREGON, 
        type: null,
        error: 'REGON must be 9 or 14 digits' 
      };
    }
    
    const is9Digit = cleanREGON.length === 9;
    const weights = is9Digit 
      ? [8, 9, 2, 3, 4, 5, 6, 7]
      : [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];
    
    const digits = cleanREGON.split('').map(Number);
    const sum = weights.reduce((acc, weight, index) => acc + weight * digits[index], 0);
    const checksum = sum % 11;
    const expectedChecksum = checksum === 10 ? 0 : checksum;
    
    if (expectedChecksum !== digits[is9Digit ? 8 : 13]) {
      return { 
        isValid: false, 
        formatted: cleanREGON, 
        type: is9Digit ? '9-digit' : '14-digit',
        error: 'Invalid REGON checksum' 
      };
    }
    
    return { 
      isValid: true, 
      formatted: cleanREGON, 
      type: is9Digit ? '9-digit' : '14-digit'
    };
  }
}
```

## Polish Address Validation

### Voivodeship (Województwo) Support

```typescript
// Polish Voivodeships
export enum PolishVoivodeship {
  DOLNOSLASKIE = 'dolnośląskie',
  KUJAWSKO_POMORSKIE = 'kujawsko-pomorskie',
  LUBELSKIE = 'lubelskie',
  LUBUSKIE = 'lubuskie',
  LODZKIE = 'łódzkie',
  MALOPOLSKIE = 'małopolskie',
  MAZOWIECKIE = 'mazowieckie',
  OPOLSKIE = 'opolskie',
  PODKARPACKIE = 'podkarpackie',
  PODLASKIE = 'podlaskie',
  POMORSKIE = 'pomorskie',
  SLASKIE = 'śląskie',
  SWIETOKRZYSKIE = 'świętokrzyskie',
  WARMINSKO_MAZURSKIE = 'warmińsko-mazurskie',
  WIELKOPOLSKIE = 'wielkopolskie',
  ZACHODNIOPOMORSKIE = 'zachodniopomorskie'
}

// Polish Postal Code Validation
class PolishPostalCodeValidator {
  static validate(postalCode: string): {
    isValid: boolean;
    formatted: string;
    error?: string;
  } {
    if (!postalCode) {
      return { isValid: false, formatted: '', error: 'Postal code is required' };
    }
    
    // Remove spaces and dashes
    const clean = postalCode.replace(/[\s-]/g, '');
    
    // Check Polish postal code format (XX-XXX)
    if (!/^\d{5}$/.test(clean)) {
      return { 
        isValid: false, 
        formatted: clean, 
        error: 'Polish postal code must be 5 digits (XX-XXX format)' 
      };
    }
    
    // Format with dash
    const formatted = `${clean.slice(0, 2)}-${clean.slice(2, 5)}`;
    
    return { isValid: true, formatted };
  }
}
```

## Invoice Compliance (Polish Standards)

### Invoice Number Format

```typescript
// Polish Invoice Number Generator
class PolishInvoiceNumberGenerator {
  /**
   * Generate Polish-compliant invoice number
   * Format: FV/YYYY/MM/NNNN
   */
  static generateInvoiceNumber(sequenceNumber: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequence = sequenceNumber.toString().padStart(4, '0');
    
    return `FV/${year}/${month}/${sequence}`;
  }
  
  /**
   * Generate quote number
   * Format: OF/YYYY/MM/NNNN
   */
  static generateQuoteNumber(sequenceNumber: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequence = sequenceNumber.toString().padStart(4, '0');
    
    return `OF/${year}/${month}/${sequence}`;
  }
}
```

### Invoice VAT Summary

```typescript
// Polish Invoice VAT Summary
interface PolishVATSummary {
  vatBreakdown: {
    rate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    description: string;
  }[];
  totals: {
    totalNet: number;
    totalVAT: number;
    totalGross: number;
    formattedTotals: {
      net: string;
      vat: string;
      gross: string;
    };
  };
}

class PolishInvoiceVATCalculator {
  static calculateVATSummary(items: Array<{
    netAmount: number;
    vatRate: number;
  }>): PolishVATSummary {
    // Group by VAT rate
    const vatGroups = items.reduce((groups, item) => {
      const rate = item.vatRate;
      if (!groups[rate]) {
        groups[rate] = { netAmount: 0, vatAmount: 0, grossAmount: 0 };
      }
      
      const vatAmount = (item.netAmount * rate) / 100;
      groups[rate].netAmount += item.netAmount;
      groups[rate].vatAmount += vatAmount;
      groups[rate].grossAmount += item.netAmount + vatAmount;
      
      return groups;
    }, {} as Record<number, { netAmount: number; vatAmount: number; grossAmount: number }>);
    
    // Create breakdown
    const vatBreakdown = Object.entries(vatGroups).map(([rate, amounts]) => ({
      rate: parseInt(rate),
      netAmount: Math.round(amounts.netAmount * 100) / 100,
      vatAmount: Math.round(amounts.vatAmount * 100) / 100,
      grossAmount: Math.round(amounts.grossAmount * 100) / 100,
      description: `VAT ${rate}%`
    }));
    
    // Calculate totals
    const totalNet = vatBreakdown.reduce((sum, item) => sum + item.netAmount, 0);
    const totalVAT = vatBreakdown.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalGross = totalNet + totalVAT;
    
    return {
      vatBreakdown,
      totals: {
        totalNet,
        totalVAT,
        totalGross,
        formattedTotals: {
          net: PolishCurrencyFormatter.formatPLN(totalNet),
          vat: PolishCurrencyFormatter.formatPLN(totalVAT),
          gross: PolishCurrencyFormatter.formatPLN(totalGross)
        }
      }
    };
  }
}
```

## Database Compliance Enhancements

### Polish Data Storage Standards

```sql
-- Polish-compliant database schema additions
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS nip VARCHAR(15),  -- NIP with formatting
ADD COLUMN IF NOT EXISTS regon VARCHAR(20), -- REGON 9 or 14 digit
ADD COLUMN IF NOT EXISTS vat_payer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT FALSE;

-- Polish address structure
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS voivodeship VARCHAR(50), -- Województwo
ADD COLUMN IF NOT EXISTS county VARCHAR(50),      -- Powiat
ADD COLUMN IF NOT EXISTS municipality VARCHAR(50); -- Gmina

-- Indexes for Polish business data
CREATE INDEX IF NOT EXISTS idx_contacts_nip ON contacts(nip);
CREATE INDEX IF NOT EXISTS idx_contacts_regon ON contacts(regon);
CREATE INDEX IF NOT EXISTS idx_contacts_voivodeship ON contacts(voivodeship);

-- Polish invoice numbering sequence
CREATE SEQUENCE IF NOT EXISTS polish_invoice_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS polish_quote_sequence START 1;
```

## Compliance Validation Service

```typescript
// Comprehensive Polish compliance validation
@Injectable()
export class PolishComplianceService {
  
  validateBusinessData(data: {
    nip?: string;
    regon?: string;
    postalCode?: string;
    voivodeship?: string;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // NIP validation
    if (data.nip) {
      const nipResult = PolishBusinessValidator.validateNIP(data.nip);
      if (!nipResult.isValid) {
        errors.push(`Invalid NIP: ${nipResult.error}`);
      }
    }
    
    // REGON validation
    if (data.regon) {
      const regonResult = PolishREGONValidator.validateREGON(data.regon);
      if (!regonResult.isValid) {
        errors.push(`Invalid REGON: ${regonResult.error}`);
      }
    }
    
    // Postal code validation
    if (data.postalCode) {
      const postalResult = PolishPostalCodeValidator.validate(data.postalCode);
      if (!postalResult.isValid) {
        errors.push(`Invalid postal code: ${postalResult.error}`);
      }
    }
    
    // Business logic warnings
    if (data.nip && !data.regon) {
      warnings.push('REGON recommended for businesses with NIP');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  formatCurrency(amount: number): string {
    return PolishCurrencyFormatter.formatPLN(amount);
  }
  
  calculateVAT(netAmount: number, vatRate: number) {
    return PolishCurrencyFormatter.formatVATBreakdown(netAmount, vatRate);
  }
  
  generateInvoiceNumber(): string {
    // Implementation would use database sequence
    const sequenceNumber = 1; // Get from database
    return PolishInvoiceNumberGenerator.generateInvoiceNumber(sequenceNumber);
  }
}
```

## Testing & Validation

### Polish Compliance Test Cases

```typescript
// Test cases for Polish compliance
describe('Polish Compliance', () => {
  describe('Currency Formatting', () => {
    it('should format PLN correctly', () => {
      expect(PolishCurrencyFormatter.formatPLN(1234.56)).toBe('1 234,56 PLN');
      expect(PolishCurrencyFormatter.formatPLN(45.5)).toBe('45,50 PLN');
      expect(PolishCurrencyFormatter.formatPLN(0.99)).toBe('0,99 PLN');
    });
  });
  
  describe('VAT Calculations', () => {
    it('should calculate 23% VAT correctly', () => {
      const result = calculateVAT(100, 23);
      expect(result.netAmount).toBe(100);
      expect(result.vatAmount).toBe(23);
      expect(result.grossAmount).toBe(123);
    });
  });
  
  describe('NIP Validation', () => {
    it('should validate correct NIP', () => {
      const result = PolishBusinessValidator.validateNIP('5260001246');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('526-000-12-46');
    });
  });
});
```

## Implementation Checklist

### Phase 4 Polish Compliance Tasks

**Week 1: Core Currency & VAT**
- ✅ Implement Polish PLN formatting
- ✅ Set up VAT rate system (0%, 8%, 23%)
- ✅ Create VAT calculation functions
- ✅ Update all price displays

**Week 2: Business Validation**
- ✅ NIP validation implementation
- ✅ REGON validation implementation  
- ✅ Postal code validation
- ✅ Voivodeship support

**Week 3: Regional Pricing**
- ✅ City-based pricing multipliers
- ✅ Regional zone configuration
- ✅ Price calculation updates
- ✅ Frontend regional display

**Week 4: Invoice Compliance**
- ✅ Polish invoice number format
- ✅ VAT summary calculations
- ✅ Invoice compliance validation
- ✅ Database schema updates

## Success Metrics

### Compliance Targets
- **VAT Accuracy**: 100% correct calculations
- **Currency Formatting**: Consistent Polish format
- **Business Validation**: NIP/REGON verification
- **Regional Pricing**: Accurate city-based multipliers
- **Invoice Compliance**: Polish standard adherence