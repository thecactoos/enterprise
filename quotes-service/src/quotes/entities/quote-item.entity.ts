import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quote } from './quote.entity';

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE'
}

@Entity('quote_items')
@Index(['quoteId'])
@Index(['productId'])
@Index(['serviceId'])
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @Column('uuid')
  quoteId: string;

  @ManyToOne(() => Quote, quote => quote.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @Column({
    type: 'enum',
    enum: ItemType
  })
  @ApiProperty({ enum: ItemType })
  itemType: ItemType;

  @Column('uuid', { nullable: true })
  @ApiProperty({ description: 'Reference to product from products service' })
  productId?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Reference to service from services service' })
  serviceId?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Service code for quick reference' })
  serviceCode?: string;

  // Item details
  @Column()
  @ApiProperty({ description: 'Position in the quote' })
  position: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Product SKU' })
  sku?: string;

  @Column({ length: 500 })
  @ApiProperty({ description: 'Item name' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Item description' })
  description?: string;

  // Quantities and units
  @Column({ type: 'decimal', precision: 15, scale: 3 })
  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @Column({ length: 20 })
  @ApiProperty({ description: 'Unit (m², szt, mb, paczka, usługa)' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @ApiProperty({ description: 'Quantity per package' })
  quantityPerPackage?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({ description: 'Number of packages' })
  numberOfPackages?: number;

  // Pricing
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @ApiProperty({ description: 'Price per unit' })
  pricePerUnit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @ApiProperty({ description: 'Discount percentage' })
  discount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @ApiProperty({ description: 'Net price (after discount)' })
  netPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 23 })
  @ApiProperty({ description: 'VAT rate' })
  vatRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @ApiProperty({ description: 'VAT amount' })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @ApiProperty({ description: 'Gross price (net + VAT)' })
  grossPrice: number;

  // For area calculations
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @ApiProperty({ description: 'Coverage per unit in m²' })
  coveragePerUnit?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @ApiProperty({ description: 'Total coverage in m²' })
  totalCoverage?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  @ApiProperty({ description: 'Waste percentage for cutting' })
  wastePercent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculated properties
  calculatePrices(): void {
    // Calculate discount amount
    if (this.discount > 0) {
      this.discountAmount = (this.pricePerUnit * this.quantity * this.discount) / 100;
    } else {
      this.discountAmount = 0;
    }

    // Calculate net price
    this.netPrice = (this.pricePerUnit * this.quantity) - this.discountAmount;

    // Calculate VAT
    this.vatAmount = (this.netPrice * this.vatRate) / 100;

    // Calculate gross price
    this.grossPrice = this.netPrice + this.vatAmount;

    // Calculate coverage if applicable
    if (this.coveragePerUnit) {
      const baseArea = this.quantity * this.coveragePerUnit;
      const wasteAmount = (baseArea * this.wastePercent) / 100;
      this.totalCoverage = baseArea + wasteAmount;
    }

    // Calculate packages if applicable
    if (this.quantityPerPackage && this.quantityPerPackage > 0) {
      this.numberOfPackages = Math.ceil(this.quantity / this.quantityPerPackage);
    }
  }

  // Helper for Polish formatting
  getFormattedUnit(): string {
    const unitMap = {
      'm2': 'm²',
      'szt': 'sztuk',
      'mb': 'metrów bieżących',
      'paczka': 'paczek',
      'usluga': 'usługa'
    };
    return unitMap[this.unit] || this.unit;
  }
}