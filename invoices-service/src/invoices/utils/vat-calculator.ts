export interface VATCalculation {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
}

export interface VATSummaryItem {
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  itemCount: number;
}

export interface InvoiceVATSummary {
  totalNet: number;
  totalVAT: number;
  totalGross: number;
  vatBreakdown: VATSummaryItem[];
  hasMultipleRates: boolean;
}

export class VATCalculator {
  /**
   * Polish VAT rates (as of 2025)
   */
  public static readonly POLISH_VAT_RATES = {
    STANDARD: 23,        // Standard rate for most goods and services
    REDUCED: 8,          // Books, medicines, some food items
    SUPER_REDUCED: 5,    // Basic food items
    ZERO: 0              // Exports, some medical services
  };

  /**
   * Calculate VAT amount from net amount
   */
  static calculateVATFromNet(netAmount: number, vatRate: number): VATCalculation {
    const vatAmount = (netAmount * vatRate) / 100;
    const grossAmount = netAmount + vatAmount;

    return {
      netAmount: this.roundToCents(netAmount),
      vatAmount: this.roundToCents(vatAmount),
      grossAmount: this.roundToCents(grossAmount),
      vatRate
    };
  }

  /**
   * Calculate net amount from gross amount
   */
  static calculateNetFromGross(grossAmount: number, vatRate: number): VATCalculation {
    const netAmount = grossAmount / (1 + vatRate / 100);
    const vatAmount = grossAmount - netAmount;

    return {
      netAmount: this.roundToCents(netAmount),
      vatAmount: this.roundToCents(vatAmount),
      grossAmount: this.roundToCents(grossAmount),
      vatRate
    };
  }

  /**
   * Calculate VAT for invoice item with quantity
   */
  static calculateItemVAT(
    quantity: number,
    unitPriceNet: number,
    vatRate: number,
    discountAmount: number = 0
  ): VATCalculation {
    let netAmount = quantity * unitPriceNet;
    
    // Apply discount
    if (discountAmount > 0) {
      netAmount -= discountAmount;
    }

    return this.calculateVATFromNet(netAmount, vatRate);
  }

  /**
   * Calculate comprehensive VAT summary for invoice
   */
  static calculateInvoiceVATSummary(
    items: Array<{
      netAmount: number;
      vatRate: number;
    }>
  ): InvoiceVATSummary {
    // Group items by VAT rate
    const vatGroups = new Map<number, {
      netAmount: number;
      vatAmount: number;
      itemCount: number;
    }>();

    items.forEach(item => {
      const vatCalc = this.calculateVATFromNet(item.netAmount, item.vatRate);
      const existing = vatGroups.get(item.vatRate) || {
        netAmount: 0,
        vatAmount: 0,
        itemCount: 0
      };

      existing.netAmount += vatCalc.netAmount;
      existing.vatAmount += vatCalc.vatAmount;
      existing.itemCount += 1;

      vatGroups.set(item.vatRate, existing);
    });

    // Create VAT breakdown
    const vatBreakdown: VATSummaryItem[] = Array.from(vatGroups.entries())
      .map(([vatRate, data]) => ({
        vatRate,
        netAmount: this.roundToCents(data.netAmount),
        vatAmount: this.roundToCents(data.vatAmount),
        grossAmount: this.roundToCents(data.netAmount + data.vatAmount),
        itemCount: data.itemCount
      }))
      .sort((a, b) => b.vatRate - a.vatRate); // Sort by VAT rate descending

    // Calculate totals
    const totalNet = this.roundToCents(
      vatBreakdown.reduce((sum, item) => sum + item.netAmount, 0)
    );
    const totalVAT = this.roundToCents(
      vatBreakdown.reduce((sum, item) => sum + item.vatAmount, 0)
    );
    const totalGross = this.roundToCents(totalNet + totalVAT);

    return {
      totalNet,
      totalVAT,
      totalGross,
      vatBreakdown,
      hasMultipleRates: vatBreakdown.length > 1
    };
  }

  /**
   * Validate Polish VAT rate
   */
  static validatePolishVATRate(vatRate: number): {
    isValid: boolean;
    message?: string;
    suggestion?: number;
  } {
    const validRates = Object.values(this.POLISH_VAT_RATES);
    
    if (validRates.includes(vatRate)) {
      return { isValid: true };
    }

    // Find closest valid rate
    const closest = validRates.reduce((prev, curr) => 
      Math.abs(curr - vatRate) < Math.abs(prev - vatRate) ? curr : prev
    );

    return {
      isValid: false,
      message: `Invalid VAT rate: ${vatRate}%. Valid Polish VAT rates: ${validRates.join('%, ')}%`,
      suggestion: closest
    };
  }

  /**
   * Get VAT rate category description
   */
  static getVATRateDescription(vatRate: number): string {
    switch (vatRate) {
      case this.POLISH_VAT_RATES.STANDARD:
        return 'Stawka podstawowa (23%)';
      case this.POLISH_VAT_RATES.REDUCED:
        return 'Stawka obniżona (8%)';
      case this.POLISH_VAT_RATES.SUPER_REDUCED:
        return 'Stawka obniżona (5%)';
      case this.POLISH_VAT_RATES.ZERO:
        return 'Stawka 0%';
      default:
        return `Stawka ${vatRate}%`;
    }
  }

  /**
   * Calculate volume discount
   */
  static calculateVolumeDiscount(
    quantity: number,
    unitPrice: number,
    volumeThreshold: number,
    discountPercent: number
  ): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    discountApplied: boolean;
  } {
    const originalAmount = quantity * unitPrice;
    let discountAmount = 0;
    let discountApplied = false;

    if (quantity >= volumeThreshold && discountPercent > 0) {
      discountAmount = (originalAmount * discountPercent) / 100;
      discountApplied = true;
    }

    return {
      originalAmount: this.roundToCents(originalAmount),
      discountAmount: this.roundToCents(discountAmount),
      finalAmount: this.roundToCents(originalAmount - discountAmount),
      discountApplied
    };
  }

  /**
   * Calculate progressive discount based on amount tiers
   */
  static calculateProgressiveDiscount(
    amount: number,
    discountTiers: Array<{
      threshold: number;
      discountPercent: number;
    }>
  ): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    appliedTier?: { threshold: number; discountPercent: number };
  } {
    // Sort tiers by threshold (descending)
    const sortedTiers = discountTiers.sort((a, b) => b.threshold - a.threshold);
    
    // Find applicable tier
    const applicableTier = sortedTiers.find(tier => amount >= tier.threshold);
    
    if (!applicableTier) {
      return {
        originalAmount: this.roundToCents(amount),
        discountAmount: 0,
        finalAmount: this.roundToCents(amount)
      };
    }

    const discountAmount = (amount * applicableTier.discountPercent) / 100;

    return {
      originalAmount: this.roundToCents(amount),
      discountAmount: this.roundToCents(discountAmount),
      finalAmount: this.roundToCents(amount - discountAmount),
      appliedTier: applicableTier
    };
  }

  /**
   * Calculate early payment discount
   */
  static calculateEarlyPaymentDiscount(
    amount: number,
    discountPercent: number,
    paymentDate: Date,
    invoiceDate: Date,
    earlyPaymentDays: number = 10
  ): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    discountEligible: boolean;
    daysEarly?: number;
  } {
    const diffTime = paymentDate.getTime() - invoiceDate.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const discountEligible = daysDiff <= earlyPaymentDays;

    let discountAmount = 0;
    if (discountEligible && discountPercent > 0) {
      discountAmount = (amount * discountPercent) / 100;
    }

    return {
      originalAmount: this.roundToCents(amount),
      discountAmount: this.roundToCents(discountAmount),
      finalAmount: this.roundToCents(amount - discountAmount),
      discountEligible,
      daysEarly: discountEligible ? earlyPaymentDays - daysDiff : undefined
    };
  }

  /**
   * Format VAT summary for Polish invoice display
   */
  static formatVATSummaryForDisplay(summary: InvoiceVATSummary): {
    title: string;
    rows: Array<{
      description: string;
      netAmount: string;
      vatRate: string;
      vatAmount: string;
      grossAmount: string;
    }>;
    totals: {
      totalNet: string;
      totalVAT: string;
      totalGross: string;
    };
  } {
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);

    const rows = summary.vatBreakdown.map(item => ({
      description: this.getVATRateDescription(item.vatRate),
      netAmount: formatCurrency(item.netAmount),
      vatRate: `${item.vatRate}%`,
      vatAmount: formatCurrency(item.vatAmount),
      grossAmount: formatCurrency(item.grossAmount)
    }));

    return {
      title: summary.hasMultipleRates ? 'Podsumowanie VAT' : 'Wartość faktury',
      rows,
      totals: {
        totalNet: formatCurrency(summary.totalNet),
        totalVAT: formatCurrency(summary.totalVAT),
        totalGross: formatCurrency(summary.totalGross)
      }
    };
  }

  /**
   * Round amount to cents (2 decimal places)
   */
  private static roundToCents(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Check if amounts are approximately equal (accounting for floating point precision)
   */
  static amountsEqual(amount1: number, amount2: number, tolerance: number = 0.01): boolean {
    return Math.abs(amount1 - amount2) <= tolerance;
  }

  /**
   * Validate VAT calculation consistency
   */
  static validateVATCalculation(
    netAmount: number,
    vatAmount: number,
    grossAmount: number,
    vatRate: number
  ): {
    isValid: boolean;
    errors: string[];
    correctedCalculation?: VATCalculation;
  } {
    const errors: string[] = [];
    
    // Calculate expected values
    const expected = this.calculateVATFromNet(netAmount, vatRate);
    
    // Check VAT amount
    if (!this.amountsEqual(vatAmount, expected.vatAmount)) {
      errors.push(`VAT amount mismatch: expected ${expected.vatAmount}, got ${vatAmount}`);
    }
    
    // Check gross amount
    if (!this.amountsEqual(grossAmount, expected.grossAmount)) {
      errors.push(`Gross amount mismatch: expected ${expected.grossAmount}, got ${grossAmount}`);
    }
    
    // Check if net + VAT = gross
    if (!this.amountsEqual(netAmount + vatAmount, grossAmount)) {
      errors.push(`Total mismatch: net + VAT (${netAmount + vatAmount}) ≠ gross (${grossAmount})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      correctedCalculation: errors.length > 0 ? expected : undefined
    };
  }
}