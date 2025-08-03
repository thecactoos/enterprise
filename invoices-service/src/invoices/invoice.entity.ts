import {
  Entity,
  PrimaryGeneratedColumn, 
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { InvoiceItem } from './invoice-item.entity';

// Polish invoice types
export enum InvoiceType {
  VAT_INVOICE = 'vat_invoice',
  PROFORMA = 'proforma',
  CORRECTIVE = 'corrective'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent', 
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
  BLIK = 'blik'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['contactId'])
@Index(['status'])
@Index(['issueDate', 'dueDate'])
@Index(['paymentStatus'])
export class Invoice {
  @ApiProperty({ 
    description: 'Unique invoice identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Polish invoice number (FV/YYYY/MM/NNNN format)',
    example: 'FV/2025/01/0001'
  })
  @Column({ name: 'invoice_number', type: 'varchar', length: 50, unique: true })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ 
    description: 'Type of invoice',
    enum: InvoiceType,
    example: InvoiceType.VAT_INVOICE
  })
  @Column({ 
    name: 'invoice_type',
    type: 'enum', 
    enum: InvoiceType,
    default: InvoiceType.VAT_INVOICE
  })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiProperty({ 
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.DRAFT
  })
  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  // Customer Information (linked to contacts service)
  @ApiProperty({ 
    description: 'Contact ID from contacts service',
    example: '660e8400-e29b-42d4-a716-446655440001'
  })
  @Column({ name: 'contact_id', type: 'uuid' })
  @IsString()
  contactId: string;

  @ApiProperty({ 
    description: 'Customer NIP (Polish tax number)',
    example: '1234567890'
  })
  @Column({ name: 'customer_nip', type: 'varchar', length: 15, nullable: true })
  @IsOptional()
  @IsString()
  customerNIP?: string;

  @ApiProperty({ 
    description: 'Customer REGON (Polish business number)',
    example: '123456789'
  })
  @Column({ name: 'customer_regon', type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  customerREGON?: string;

  @ApiProperty({ 
    description: 'Whether customer is VAT payer',
    example: true
  })
  @Column({ name: 'customer_vat_payer', type: 'boolean', default: true })
  @IsBoolean()
  customerVATPayer: boolean;

  @ApiProperty({ 
    description: 'Customer name/company name',
    example: 'ABC Construction Sp. z o.o.'
  })
  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  @IsString()
  customerName: string;

  @ApiProperty({ 
    description: 'Customer address',
    example: 'ul. Budowlana 123, 00-001 Warsaw, Poland'
  })
  @Column({ name: 'customer_address', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  // Polish Invoice Dates (required by law)
  @ApiProperty({ 
    description: 'Invoice issue date',
    example: '2025-01-15'
  })
  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @ApiProperty({ 
    description: 'Sale date (data sprzedaży)',
    example: '2025-01-15'
  })
  @Column({ name: 'sale_date', type: 'date' })
  saleDate: Date;

  @ApiProperty({ 
    description: 'Payment due date',
    example: '2025-02-14'
  })
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  // Financial Summary (in PLN)
  @ApiProperty({ 
    description: 'Total net amount in PLN',
    example: 1000.00
  })
  @Column({ 
    name: 'total_net',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalNet: number;

  @ApiProperty({ 
    description: 'Total VAT amount in PLN',
    example: 230.00
  })
  @Column({ 
    name: 'total_vat',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalVAT: number;

  @ApiProperty({ 
    description: 'Total gross amount in PLN',
    example: 1230.00
  })
  @Column({ 
    name: 'total_gross',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalGross: number;

  @ApiProperty({ 
    description: 'Currency (always PLN for Polish invoices)',
    example: 'PLN'
  })
  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'PLN' })
  @IsString()
  currency: string;

  // Payment Information
  @ApiProperty({ 
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER
  })
  @Column({ 
    name: 'payment_method',
    type: 'enum', 
    enum: PaymentMethod,
    default: PaymentMethod.BANK_TRANSFER
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ 
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING
  })
  @Column({ 
    name: 'payment_status',
    type: 'enum', 
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ 
    description: 'Date when payment was received',
    example: '2025-01-20T10:30:00Z'
  })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  @IsOptional()
  paidAt?: Date;

  // Additional Information
  @ApiProperty({ 
    description: 'Additional notes',
    example: 'Installation completed as agreed'
  })
  @Column({ name: 'notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Payment terms',
    example: 'Payment due within 30 days of invoice date'
  })
  @Column({ name: 'payment_terms', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({ 
    description: 'Quote ID if invoice was created from quote',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'quote_id', type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({ 
    description: 'User ID who created the invoice',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ 
    description: 'Invoice creation timestamp',
    example: '2025-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Invoice last update timestamp',
    example: '2025-01-20T14:45:00Z'
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true, eager: false })
  items: InvoiceItem[];

  // Computed Properties for Polish Formatting

  @ApiProperty({ 
    description: 'Formatted total net in Polish format',
    example: '1 000,00 PLN'
  })
  get formattedTotalNet(): string {
    return this.formatPolishCurrency(this.totalNet);
  }

  @ApiProperty({ 
    description: 'Formatted total VAT in Polish format',
    example: '230,00 PLN'
  })
  get formattedTotalVAT(): string {
    return this.formatPolishCurrency(this.totalVAT);
  }

  @ApiProperty({ 
    description: 'Formatted total gross in Polish format',
    example: '1 230,00 PLN'
  })
  get formattedTotalGross(): string {
    return this.formatPolishCurrency(this.totalGross);
  }

  @ApiProperty({ 
    description: 'Days until due date',
    example: 15
  })
  get daysUntilDue(): number {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  @ApiProperty({ 
    description: 'Whether invoice is overdue',
    example: false
  })
  get isOverdue(): boolean {
    return this.daysUntilDue < 0 && this.paymentStatus !== PaymentStatus.PAID;
  }

  @ApiProperty({ 
    description: 'Payment status display text',
    example: 'Oczekuje na płatność'
  })
  get paymentStatusText(): string {
    const statusMap = {
      [PaymentStatus.PENDING]: 'Oczekuje na płatność',
      [PaymentStatus.PARTIAL]: 'Częściowo opłacona',
      [PaymentStatus.PAID]: 'Opłacona',
      [PaymentStatus.OVERDUE]: 'Przeterminowana'
    };
    return statusMap[this.paymentStatus] || 'Nieznany status';
  }

  // Helper Methods

  /**
   * Format currency according to Polish standards (1 234,56 PLN)
   */
  private formatPolishCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '0,00 PLN';
    
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calculate totals from invoice items
   */
  calculateTotals(): void {
    if (!this.items || this.items.length === 0) {
      this.totalNet = 0;
      this.totalVAT = 0;
      this.totalGross = 0;
      return;
    }

    this.totalNet = this.items.reduce((sum, item) => sum + Number(item.totalNet), 0);
    this.totalVAT = this.items.reduce((sum, item) => sum + Number(item.totalVAT), 0);
    this.totalGross = this.items.reduce((sum, item) => sum + Number(item.totalGross), 0);

    // Round to 2 decimal places
    this.totalNet = Math.round(this.totalNet * 100) / 100;
    this.totalVAT = Math.round(this.totalVAT * 100) / 100;
    this.totalGross = Math.round(this.totalGross * 100) / 100;
  }

  /**
   * Get VAT summary by rate for Polish invoice format
   */
  getVATSummary(): { vatRate: number; netAmount: number; vatAmount: number; grossAmount: number }[] {
    if (!this.items || this.items.length === 0) return [];

    const vatGroups = new Map<number, { net: number; vat: number; gross: number }>();

    this.items.forEach(item => {
      const rate = item.vatRate;
      const existing = vatGroups.get(rate) || { net: 0, vat: 0, gross: 0 };
      
      existing.net += Number(item.totalNet);
      existing.vat += Number(item.totalVAT);
      existing.gross += Number(item.totalGross);
      
      vatGroups.set(rate, existing);
    });

    return Array.from(vatGroups.entries()).map(([rate, amounts]) => ({
      vatRate: rate,
      netAmount: Math.round(amounts.net * 100) / 100,
      vatAmount: Math.round(amounts.vat * 100) / 100,
      grossAmount: Math.round(amounts.gross * 100) / 100
    }));
  }

  /**
   * Generate display summary for Polish invoice
   */
  getInvoiceSummary(): {
    invoiceNumber: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    totalNet: string;
    totalVAT: string;
    totalGross: string;
    paymentStatus: string;
    daysUntilDue: number;
  } {
    return {
      invoiceNumber: this.invoiceNumber,
      customerName: this.customerName,
      issueDate: this.issueDate.toLocaleDateString('pl-PL'),
      dueDate: this.dueDate.toLocaleDateString('pl-PL'),
      totalNet: this.formattedTotalNet,
      totalVAT: this.formattedTotalVAT,
      totalGross: this.formattedTotalGross,
      paymentStatus: this.paymentStatusText,
      daysUntilDue: this.daysUntilDue
    };
  }
}