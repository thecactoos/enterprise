import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Invoice } from './invoice.entity';

export enum ItemType {
  SERVICE = 'service',
  PRODUCT = 'product'
}

@Entity('invoice_items')
@Index(['invoiceId']) 
@Index(['serviceId'])
@Index(['productId'])
export class InvoiceItem {
  @ApiProperty({ 
    description: 'Unique invoice item identifier',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Invoice ID this item belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'invoice_id', type: 'uuid' })
  @IsString()
  invoiceId: string;

  @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  // Item Reference (Service or Product)
  @ApiProperty({ 
    description: 'Type of item',
    enum: ItemType,
    example: ItemType.SERVICE
  })
  @Column({ 
    name: 'item_type',
    type: 'enum', 
    enum: ItemType
  })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({ 
    description: 'Service ID if item is a service',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ 
    description: 'Product ID if item is a product',
    example: '123e4567-e89b-12d3-a456-426614174003'
  })
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  productId?: string;

  // Item Details
  @ApiProperty({ 
    description: 'Item description',
    example: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie'
  })
  @Column({ name: 'description', type: 'text' })
  @IsString()
  description: string;

  @ApiProperty({ 
    description: 'Quantity',
    example: 25.5
  })
  @Column({ 
    name: 'quantity',
    type: 'decimal', 
    precision: 10, 
    scale: 3
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({ 
    description: 'Unit of measurement',
    example: 'm²'
  })
  @Column({ name: 'unit', type: 'varchar', length: 20 })
  @IsString()
  unit: string;

  @ApiProperty({ 
    description: 'Unit price net (without VAT) in PLN',
    example: 45.50
  })
  @Column({ 
    name: 'unit_price_net',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPriceNet: number;

  @ApiProperty({ 
    description: 'VAT rate percentage',
    example: 23.00
  })
  @Column({ 
    name: 'vat_rate',
    type: 'decimal', 
    precision: 5, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  vatRate: number;

  // Calculated Totals
  @ApiProperty({ 
    description: 'Total net amount (quantity × unit price net)',
    example: 1160.25
  })
  @Column({ 
    name: 'total_net',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalNet: number;

  @ApiProperty({ 
    description: 'Total VAT amount',
    example: 266.86
  })
  @Column({ 
    name: 'total_vat',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalVAT: number;

  @ApiProperty({ 
    description: 'Total gross amount (net + VAT)',
    example: 1427.11
  })
  @Column({ 
    name: 'total_gross',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalGross: number;

  // Pricing Context (for services from Services Service)
  @ApiProperty({ 
    description: 'Pricing tier used for calculation',
    example: 'standard'
  })
  @Column({ name: 'pricing_tier', type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  pricingTier?: string;

  @ApiProperty({ 
    description: 'Regional zone used for pricing',
    example: 'warsaw'
  })
  @Column({ name: 'regional_zone', type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  regionalZone?: string;

  @ApiProperty({ 
    description: 'Discount percentage applied',
    example: 10.00
  })
  @Column({ 
    name: 'discount_percent',
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent: number;

  @ApiProperty({ 
    description: 'Discount amount in PLN',
    example: 50.00
  })
  @Column({ 
    name: 'discount_amount',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount: number;

  @ApiProperty({ 
    description: 'Item sequence/line number on invoice',
    example: 1
  })
  @Column({ name: 'line_number', type: 'integer', default: 1 })
  @IsNumber()
  @Min(1)
  lineNumber: number;

  @ApiProperty({ 
    description: 'Item creation timestamp',
    example: '2025-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Computed Properties

  @ApiProperty({ 
    description: 'Formatted unit price in Polish format',
    example: '45,50 PLN'
  })
  get formattedUnitPrice(): string {
    return this.formatPolishCurrency(this.unitPriceNet);
  }

  @ApiProperty({ 
    description: 'Formatted total net in Polish format',
    example: '1 160,25 PLN'
  })
  get formattedTotalNet(): string {
    return this.formatPolishCurrency(this.totalNet);
  }

  @ApiProperty({ 
    description: 'Formatted total VAT in Polish format',
    example: '266,86 PLN'
  })
  get formattedTotalVAT(): string {
    return this.formatPolishCurrency(this.totalVAT);
  }

  @ApiProperty({ 
    description: 'Formatted total gross in Polish format',
    example: '1 427,11 PLN'
  })
  get formattedTotalGross(): string {
    return this.formatPolishCurrency(this.totalGross);
  }

  @ApiProperty({ 
    description: 'Formatted quantity with unit',
    example: '25,500 m²'
  })
  get formattedQuantity(): string {
    const qty = this.quantity.toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
    return `${qty} ${this.unit}`;
  }

  // Methods

  /**
   * Calculate totals based on quantity, unit price, and VAT rate
   */
  calculateTotals(): void {
    // Calculate net total
    this.totalNet = this.quantity * this.unitPriceNet;
    
    // Apply discount if any
    if (this.discountAmount > 0) {
      this.totalNet -= this.discountAmount;
    } else if (this.discountPercent > 0) {
      const discountAmount = (this.totalNet * this.discountPercent) / 100;
      this.totalNet -= discountAmount;
      this.discountAmount = Math.round(discountAmount * 100) / 100;
    }

    // Calculate VAT
    this.totalVAT = (this.totalNet * this.vatRate) / 100;
    
    // Calculate gross total
    this.totalGross = this.totalNet + this.totalVAT;

    // Round all values to 2 decimal places
    this.totalNet = Math.round(this.totalNet * 100) / 100;
    this.totalVAT = Math.round(this.totalVAT * 100) / 100;
    this.totalGross = Math.round(this.totalGross * 100) / 100;
  }

  /**
   * Format currency according to Polish standards
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
   * Get item summary for display
   */
  getItemSummary(): {
    lineNumber: number;
    description: string;
    quantity: string;
    unitPrice: string;
    totalNet: string;
    vatRate: string;
    totalVAT: string;
    totalGross: string;
    discountApplied?: string;
  } {
    const summary: any = {
      lineNumber: this.lineNumber,
      description: this.description,
      quantity: this.formattedQuantity,
      unitPrice: this.formattedUnitPrice,
      totalNet: this.formattedTotalNet,
      vatRate: `${this.vatRate}%`,
      totalVAT: this.formattedTotalVAT,
      totalGross: this.formattedTotalGross
    };

    if (this.discountAmount > 0) {
      summary.discountApplied = this.formatPolishCurrency(this.discountAmount);
    }

    return summary;
  }

  /**
   * Validate item data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (this.unitPriceNet < 0) {
      errors.push('Unit price cannot be negative');
    }

    if (this.vatRate < 0 || this.vatRate > 100) {
      errors.push('VAT rate must be between 0 and 100');
    }

    if (!this.unit || this.unit.trim().length === 0) {
      errors.push('Unit is required');
    }

    if (this.itemType === ItemType.SERVICE && !this.serviceId) {
      errors.push('Service ID is required for service items');
    }

    if (this.itemType === ItemType.PRODUCT && !this.productId) {
      errors.push('Product ID is required for product items');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}