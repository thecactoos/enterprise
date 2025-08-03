import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsUUID, IsBoolean } from 'class-validator';
import { Contractor } from '../contractors/contractor.entity';
import { PriceHistory } from '../history/price-history.entity';

@Entity('service_pricing')
@Index(['serviceId', 'contractorId'], { unique: true })
@Index(['serviceId', 'isActive'])
@Index(['contractorId', 'isActive'])
@Index(['effectiveFrom', 'effectiveTo'])
export class ServicePricing {
  @ApiProperty({ 
    description: 'Unique pricing record identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Reference to service from services-service',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'service_id', type: 'uuid' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ 
    description: 'Contractor providing this pricing'
  })
  @ManyToOne(() => Contractor, (contractor) => contractor.servicePricing)
  @JoinColumn({ name: 'contractor_id' })
  contractor: Contractor;

  @Column({ name: 'contractor_id', type: 'uuid' })
  @IsUUID()
  contractorId: string;

  @ApiProperty({ 
    description: 'Purchase cost (what we pay to contractor)',
    example: 35.00
  })
  @Column({ 
    name: 'purchase_cost',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseCost: number;

  @ApiProperty({ 
    description: 'Sale price (what we charge clients)',
    example: 45.50
  })
  @Column({ 
    name: 'sale_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice: number;

  @ApiProperty({ 
    description: 'Retail price for end customers',
    example: 65.00
  })
  @Column({ 
    name: 'retail_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  retailPrice: number;


  @ApiProperty({ 
    description: 'Currency code',
    example: 'PLN'
  })
  @Column({ 
    name: 'currency',
    type: 'varchar', 
    length: 3,
    default: 'PLN'
  })
  @IsString()
  currency: string;

  @ApiProperty({ 
    description: 'Whether this pricing is currently active',
    example: true
  })
  @Column({ 
    name: 'is_active',
    type: 'boolean',
    default: true
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ 
    description: 'Date when this pricing becomes effective',
    example: '2024-01-01T00:00:00Z'
  })
  @Column({ name: 'effective_from', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveFrom: Date;

  @ApiProperty({ 
    description: 'Date when this pricing expires',
    required: false
  })
  @Column({ name: 'effective_to', type: 'timestamp', nullable: true })
  @IsOptional()
  effectiveTo?: Date;

  @ApiProperty({ 
    description: 'Additional notes about this pricing',
    required: false
  })
  @Column({ name: 'notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Pricing creation date',
    example: '2024-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Last pricing update date',
    example: '2024-01-20T14:45:00Z'
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => PriceHistory, (history) => history.servicePricing)
  priceHistory: PriceHistory[];

  // Computed properties
  @ApiProperty({ 
    description: 'Profit margin percentage',
    example: 30.0
  })
  get profitMargin(): number {
    return ((this.salePrice - this.purchaseCost) / this.purchaseCost) * 100;
  }

  @ApiProperty({ 
    description: 'Markup percentage over purchase cost',
    example: 42.86
  })
  get markup(): number {
    return ((this.salePrice - this.purchaseCost) / this.salePrice) * 100;
  }

  @ApiProperty({ 
    description: 'Retail margin percentage',
    example: 44.4
  })
  get retailMargin(): number {
    return ((this.retailPrice - this.salePrice) / this.salePrice) * 100;
  }

  /**
   * Check if pricing is currently valid
   */
  isValidForDate(date: Date = new Date()): boolean {
    if (!this.isActive) return false;
    if (date < this.effectiveFrom) return false;
    if (this.effectiveTo && date > this.effectiveTo) return false;
    return true;
  }

  /**
   * Create pricing summary for quotes
   */
  getPricingSummary(): {
    serviceId: string;
    contractorId: string;
    contractorName: string;
    purchaseCost: number;
    salePrice: number;
    retailPrice: number;
    profitMargin: number;
    markup: number;
    retailMargin: number;
    currency: string;
  } {
    return {
      serviceId: this.serviceId,
      contractorId: this.contractorId,
      contractorName: this.contractor?.contractorName || 'Unknown',
      purchaseCost: this.purchaseCost,
      salePrice: this.salePrice,
      retailPrice: this.retailPrice,
      profitMargin: this.profitMargin,
      markup: this.markup,
      retailMargin: this.retailMargin,
      currency: this.currency
    };
  }
}