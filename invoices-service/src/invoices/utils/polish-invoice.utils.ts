import { InvoiceType } from '../invoice.entity';

export interface PolishInvoiceNumberConfig {
  prefix: string;
  year: number;
  month: number;
  sequence: number;
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  customerInfo?: {
    name: string;
    nip?: string;
    regon?: string;
    vatPayer: boolean;
    address?: string;
  };
}

export interface VATSummary {
  totalNet: number;
  totalVAT: number;
  totalGross: number;
  vatBreakdown: {
    vatRate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }[];
}

export class PolishInvoiceNumberGenerator {
  /**
   * Generate Polish VAT invoice number in format FV/YYYY/MM/NNNN
   */
  static generateInvoiceNumber(sequence: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequenceStr = String(sequence).padStart(4, '0');
    
    return `FV/${year}/${month}/${sequenceStr}`;
  }

  /**
   * Generate proforma invoice number in format PF/YYYY/MM/NNNN
   */
  static generateProformaNumber(sequence: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequenceStr = String(sequence).padStart(4, '0');
    
    return `PF/${year}/${month}/${sequenceStr}`;
  }

  /**
   * Generate corrective invoice number in format FK/YYYY/MM/NNNN
   */
  static generateCorrectiveNumber(sequence: number, date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequenceStr = String(sequence).padStart(4, '0');
    
    return `FK/${year}/${month}/${sequenceStr}`;
  }

  /**
   * Generate invoice number based on type
   */
  static generateByType(invoiceType: InvoiceType, sequence: number, date: Date = new Date()): string {
    switch (invoiceType) {
      case InvoiceType.VAT_INVOICE:
        return this.generateInvoiceNumber(sequence, date);
      case InvoiceType.PROFORMA:
        return this.generateProformaNumber(sequence, date);
      case InvoiceType.CORRECTIVE:
        return this.generateCorrectiveNumber(sequence, date);
      default:
        return this.generateInvoiceNumber(sequence, date);
    }
  }

  /**
   * Parse invoice number to extract components
   */
  static parseInvoiceNumber(invoiceNumber: string): PolishInvoiceNumberConfig | null {
    const regex = /^(FV|PF|FK)\/(\d{4})\/(\d{2})\/(\d{4})$/;
    const match = invoiceNumber.match(regex);
    
    if (!match) return null;
    
    return {
      prefix: match[1],
      year: parseInt(match[2]),
      month: parseInt(match[3]),
      sequence: parseInt(match[4])
    };
  }

  /**
   * Validate invoice number format
   */
  static validateInvoiceNumber(invoiceNumber: string): boolean {
    return this.parseInvoiceNumber(invoiceNumber) !== null;
  }

  /**
   * Get next sequence number for given month/year
   */
  static getNextSequence(existingNumbers: string[], year: number, month: number): number {
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year);
    
    const matchingNumbers = existingNumbers
      .map(num => this.parseInvoiceNumber(num))
      .filter(parsed => parsed && parsed.year === year && parsed.month === month)
      .map(parsed => parsed!.sequence);
    
    if (matchingNumbers.length === 0) return 1;
    
    return Math.max(...matchingNumbers) + 1;
  }
}

export class PolishCurrencyFormatter {
  /**
   * Format amount in Polish currency format (1 234,56 PLN)
   */
  static formatPLN(amount: number): string {
    if (amount === null || amount === undefined) return '0,00 PLN';
    
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format amount without currency symbol (1 234,56)
   */
  static formatAmount(amount: number): string {
    if (amount === null || amount === undefined) return '0,00';
    
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Parse Polish formatted amount to number
   */
  static parseAmount(formattedAmount: string): number {
    // Remove currency symbol and spaces
    const cleaned = formattedAmount
      .replace(/PLN/g, '')
      .replace(/\s/g, '')
      .replace(',', '.');
    
    return parseFloat(cleaned) || 0;
  }

  /**
   * Format amount in words (Polish)
   */
  static amountInWords(amount: number): string {
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
    const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

    if (amount === 0) return 'zero złotych';

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';

    // Thousands
    const thousands = Math.floor(integerPart / 1000);
    if (thousands > 0) {
      result += this.convertHundreds(thousands, units, teens, tens, hundreds);
      if (thousands === 1) {
        result += ' tysiąc ';
      } else if (thousands >= 2 && thousands <= 4) {
        result += ' tysiące ';
      } else {
        result += ' tysięcy ';
      }
    }

    // Hundreds
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      result += this.convertHundreds(remainder, units, teens, tens, hundreds);
    }

    // Add currency
    if (integerPart === 1) {
      result += ' złoty';
    } else if (integerPart >= 2 && integerPart <= 4) {
      result += ' złote';
    } else {
      result += ' złotych';
    }

    // Add decimal part
    if (decimalPart > 0) {
      result += ' ' + this.convertHundreds(decimalPart, units, teens, tens, hundreds);
      if (decimalPart === 1) {
        result += ' grosz';
      } else if (decimalPart >= 2 && decimalPart <= 4) {
        result += ' grosze';
      } else {
        result += ' groszy';
      }
    }

    return result.trim();
  }

  private static convertHundreds(number: number, units: string[], teens: string[], tens: string[], hundreds: string[]): string {
    let result = '';

    const h = Math.floor(number / 100);
    const t = Math.floor((number % 100) / 10);
    const u = number % 10;

    if (h > 0) {
      result += hundreds[h] + ' ';
    }

    if (t === 1) {
      result += teens[u] + ' ';
    } else {
      if (t > 0) {
        result += tens[t] + ' ';
      }
      if (u > 0) {
        result += units[u] + ' ';
      }
    }

    return result.trim();
  }
}

export class PolishVATCalculator {
  /**
   * Standard Polish VAT rates
   */
  static readonly VAT_RATES = {
    STANDARD: 23,    // Standard rate for most goods and services
    REDUCED: 8,      // Reduced rate for books, medicines, etc.
    SUPER_REDUCED: 5, // Super reduced rate for food
    ZERO: 0          // Zero rate for exports, etc.
  };

  /**
   * Calculate VAT amount from net amount
   */
  static calculateVAT(netAmount: number, vatRate: number): number {
    const vatAmount = (netAmount * vatRate) / 100;
    return Math.round(vatAmount * 100) / 100;
  }

  /**
   * Calculate net amount from gross amount
   */
  static calculateNet(grossAmount: number, vatRate: number): number {
    const netAmount = grossAmount / (1 + vatRate / 100);
    return Math.round(netAmount * 100) / 100;
  }

  /**
   * Calculate gross amount from net amount
   */
  static calculateGross(netAmount: number, vatRate: number): number {
    return netAmount + this.calculateVAT(netAmount, vatRate);
  }

  /**
   * Calculate VAT summary for multiple items
   */
  static calculateVATSummary(items: { netAmount: number; vatRate: number }[]): VATSummary {
    const vatGroups = new Map<number, { net: number; vat: number }>();

    // Group by VAT rate
    items.forEach(item => {
      const rate = item.vatRate;
      const existing = vatGroups.get(rate) || { net: 0, vat: 0 };
      
      existing.net += item.netAmount;
      existing.vat += this.calculateVAT(item.netAmount, rate);
      
      vatGroups.set(rate, existing);
    });

    // Calculate breakdown
    const vatBreakdown = Array.from(vatGroups.entries()).map(([rate, amounts]) => ({
      vatRate: rate,
      netAmount: Math.round(amounts.net * 100) / 100,
      vatAmount: Math.round(amounts.vat * 100) / 100,
      grossAmount: Math.round((amounts.net + amounts.vat) * 100) / 100
    }));

    // Calculate totals
    const totalNet = vatBreakdown.reduce((sum, item) => sum + item.netAmount, 0);
    const totalVAT = vatBreakdown.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalGross = vatBreakdown.reduce((sum, item) => sum + item.grossAmount, 0);

    return {
      totalNet: Math.round(totalNet * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      vatBreakdown
    };
  }

  /**
   * Validate VAT rate for Polish invoices
   */
  static validateVATRate(vatRate: number): { isValid: boolean; message?: string } {
    const validRates = [0, 5, 8, 23];
    
    if (!validRates.includes(vatRate)) {
      return {
        isValid: false,
        message: `Invalid VAT rate: ${vatRate}%. Valid rates in Poland: ${validRates.join('%, ')}%`
      };
    }

    return { isValid: true };
  }
}

export class PolishBusinessValidator {
  /**
   * Validate Polish NIP (tax identification number)
   */
  static validateNIP(nip: string): { isValid: boolean; message?: string } {
    if (!nip) return { isValid: true }; // NIP is optional

    // Remove spaces and dashes
    const cleanNIP = nip.replace(/[\s-]/g, '');

    // Check length
    if (cleanNIP.length !== 10) {
      return { isValid: false, message: 'NIP must have exactly 10 digits' };
    }

    // Check if all characters are digits
    if (!/^\d{10}$/.test(cleanNIP)) {
      return { isValid: false, message: 'NIP must contain only digits' };
    }

    // Calculate checksum
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNIP[i]) * weights[i];
    }

    const checksum = sum % 11;
    const lastDigit = parseInt(cleanNIP[9]);

    if (checksum === 10 || checksum === lastDigit) {
      return { isValid: true };
    }

    return { isValid: false, message: 'Invalid NIP checksum' };
  }

  /**
   * Validate Polish REGON (business registration number)
   */
  static validateREGON(regon: string): { isValid: boolean; message?: string } {
    if (!regon) return { isValid: true }; // REGON is optional

    // Remove spaces and dashes
    const cleanREGON = regon.replace(/[\s-]/g, '');

    // Check length (9 or 14 digits)
    if (cleanREGON.length !== 9 && cleanREGON.length !== 14) {
      return { isValid: false, message: 'REGON must have 9 or 14 digits' };
    }

    // Check if all characters are digits
    if (!/^\d+$/.test(cleanREGON)) {
      return { isValid: false, message: 'REGON must contain only digits' };
    }

    // Validate 9-digit REGON
    if (cleanREGON.length === 9) {
      const weights = [8, 9, 2, 3, 4, 5, 6, 7];
      let sum = 0;

      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanREGON[i]) * weights[i];
      }

      const checksum = sum % 11;
      const lastDigit = parseInt(cleanREGON[8]);

      if ((checksum === 10 ? 0 : checksum) === lastDigit) {
        return { isValid: true };
      }

      return { isValid: false, message: 'Invalid REGON checksum' };
    }

    // Validate 14-digit REGON (simplified check)
    return { isValid: true };
  }

  /**
   * Format NIP for display (add dashes)
   */
  static formatNIP(nip: string): string {
    if (!nip) return '';
    const clean = nip.replace(/[\s-]/g, '');
    if (clean.length !== 10) return nip;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
  }

  /**
   * Format REGON for display
   */
  static formatREGON(regon: string): string {
    if (!regon) return '';
    const clean = regon.replace(/[\s-]/g, '');
    if (clean.length === 9) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    if (clean.length === 14) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 8)}-${clean.slice(8)}`;
    }
    return regon;
  }
}

export class PolishDateFormatter {
  /**
   * Format date in Polish format (DD.MM.YYYY)
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('pl-PL');
  }

  /**
   * Format date for invoice display
   */
  static formatInvoiceDate(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  /**
   * Get payment terms text in Polish
   */
  static getPaymentTermsText(dueDate: Date, issueDate: Date): string {
    const diffTime = dueDate.getTime() - issueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `Płatność w terminie ${diffDays} dni od daty wystawienia faktury`;
  }

  /**
   * Get Polish legal text for invoices
   */
  static getLegalText(): string {
    return 'Faktura VAT wystawiona zgodnie z ustawą o podatku od towarów i usług z dnia 11 marca 2004 r. (Dz.U. z 2021 r. poz. 685).';
  }
}