import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, IsUUID, IsBoolean } from 'class-validator';
import { ServicePricing, PriceType } from '../pricing/service-pricing.entity';

export enum ChangeReason {
  INITIAL_SETUP = 'initial_setup',
  MARKET_ADJUSTMENT = 'market_adjustment',
  COST_CHANGE = 'cost_change',
  SEASONAL_ADJUSTMENT = 'seasonal_adjustment',
  CONTRACTOR_REQUEST = 'contractor_request',
  COMPETITIVE_ADJUSTMENT = 'competitive_adjustment',
  VOLUME_DISCOUNT_UPDATE = 'volume_discount_update',
  CORRECTION = 'correction',
  POLICY_CHANGE = 'policy_change',
  OTHER = 'other'
}

@Entity('price_history')
@Index(['servicePricingId', 'createdAt'])
@Index(['priceType', 'createdAt'])
@Index(['changeReason'])
@Index(['createdAt'])
export class PriceHistory {
  @ApiProperty({ 
    description: 'Unique price history record identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Related service pricing record'
  })
  @ManyToOne(() => ServicePricing, (servicePricing) => servicePricing.priceHistory, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'service_pricing_id' })
  servicePricing: ServicePricing;

  @Column({ name: 'service_pricing_id', type: 'uuid' })
  @IsUUID()
  servicePricingId: string;

  @ApiProperty({ 
    description: 'Type of price that changed',
    enum: PriceType,
    example: PriceType.CONTRACTOR
  })
  @Column({ 
    name: 'price_type',
    type: 'enum', 
    enum: PriceType 
  })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({ 
    description: 'Previous price value',
    example: 42.50,
    required: false
  })
  @Column({ 
    name: 'old_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oldPrice?: number;

  @ApiProperty({ 
    description: 'New price value',
    example: 45.50
  })
  @Column({ 
    name: 'new_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  newPrice: number;

  @ApiProperty({ 
    description: 'Previous purchase cost',
    example: 32.00,
    required: false
  })
  @Column({ 
    name: 'old_purchase_cost',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oldPurchaseCost?: number;

  @ApiProperty({ 
    description: 'New purchase cost',
    example: 35.00,
    required: false
  })
  @Column({ 
    name: 'new_purchase_cost',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  newPurchaseCost?: number;

  @ApiProperty({ 
    description: 'Previous retail price',
    example: 58.00,
    required: false
  })
  @Column({ 
    name: 'old_retail_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oldRetailPrice?: number;

  @ApiProperty({ 
    description: 'New retail price',
    example: 65.00,
    required: false
  })
  @Column({ 
    name: 'new_retail_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    nullable: true
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  newRetailPrice?: number;

  @ApiProperty({ 
    description: 'Reason for price change',
    enum: ChangeReason,
    example: ChangeReason.MARKET_ADJUSTMENT
  })
  @Column({ 
    name: 'change_reason',
    type: 'enum', 
    enum: ChangeReason 
  })
  @IsEnum(ChangeReason)
  changeReason: ChangeReason;

  @ApiProperty({ 
    description: 'Percentage change in price',
    example: 7.06
  })
  @Column({ 
    name: 'percentage_change',
    type: 'decimal', 
    precision: 8, 
    scale: 4
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  percentageChange: number;

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
    description: 'Whether this was an automatic system change',
    example: false
  })
  @Column({ 
    name: 'is_automatic',
    type: 'boolean',
    default: false
  })
  @IsBoolean()
  isAutomatic: boolean;

  @ApiProperty({ 
    description: 'ID of user who made the change',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  changedByUserId?: string;

  @ApiProperty({ 
    description: 'Name of user who made the change',
    example: 'Jan Kowalski',
    required: false
  })
  @Column({ name: 'changed_by_user_name', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  changedByUserName?: string;

  @ApiProperty({ 
    description: 'Additional notes about the price change',
    example: 'Adjusted due to increased supplier costs',
    required: false
  })
  @Column({ name: 'notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Date when price change was effective',
    example: '2024-01-15T00:00:00Z'
  })
  @Column({ name: 'effective_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveDate: Date;

  @ApiProperty({ 
    description: 'Date when price change was recorded',
    example: '2024-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Computed properties
  @ApiProperty({ 
    description: 'Formatted price change display',
    example: '42,50 PLN → 45,50 PLN (+7,06%)'
  })
  get formattedChange(): string {
    const oldDisplay = this.oldPrice ? `${this.oldPrice.toFixed(2).replace('.', ',')} PLN` : 'N/A';
    const newDisplay = `${this.newPrice.toFixed(2).replace('.', ',')} PLN`;
    const changeSign = this.percentageChange >= 0 ? '+' : '';
    return `${oldDisplay} → ${newDisplay} (${changeSign}${this.percentageChange.toFixed(2)}%)`;
  }

  @ApiProperty({ 
    description: 'Human-readable change reason',
    example: 'Dostosowanie rynkowe'
  })
  get formattedReason(): string {
    const reasonTexts = {
      [ChangeReason.INITIAL_SETUP]: 'Ustawienie początkowe',
      [ChangeReason.MARKET_ADJUSTMENT]: 'Dostosowanie rynkowe',
      [ChangeReason.COST_CHANGE]: 'Zmiana kosztów',
      [ChangeReason.SEASONAL_ADJUSTMENT]: 'Korekta sezonowa',
      [ChangeReason.CONTRACTOR_REQUEST]: 'Prośba wykonawcy',
      [ChangeReason.COMPETITIVE_ADJUSTMENT]: 'Dostosowanie konkurencyjne',
      [ChangeReason.VOLUME_DISCOUNT_UPDATE]: 'Aktualizacja rabatu ilościowego',
      [ChangeReason.CORRECTION]: 'Korekta',
      [ChangeReason.POLICY_CHANGE]: 'Zmiana polityki cenowej',
      [ChangeReason.OTHER]: 'Inne'
    };
    
    return reasonTexts[this.changeReason] || this.changeReason;
  }

  @ApiProperty({ 
    description: 'Change impact assessment',
    example: 'significant_increase'
  })
  get changeImpact(): 'minimal' | 'moderate' | 'significant_increase' | 'significant_decrease' {
    const absChange = Math.abs(this.percentageChange);
    
    if (absChange <= 5) return 'minimal';
    if (absChange <= 15) return 'moderate';
    return this.percentageChange > 0 ? 'significant_increase' : 'significant_decrease';
  }

  /**
   * Calculate price difference in absolute terms
   */
  getPriceDifference(): number {
    if (!this.oldPrice) return this.newPrice;
    return this.newPrice - this.oldPrice;
  }

  /**
   * Get change summary for reports
   */
  getChangeSummary(): {
    priceType: string;
    oldPrice: number | null;
    newPrice: number;
    difference: number;
    percentageChange: number;
    reason: string;
    impact: string;
    effectiveDate: Date;
  } {
    return {
      priceType: this.priceType,
      oldPrice: this.oldPrice || null,
      newPrice: this.newPrice,
      difference: this.getPriceDifference(),
      percentageChange: this.percentageChange,
      reason: this.formattedReason,
      impact: this.changeImpact,
      effectiveDate: this.effectiveDate
    };
  }

  /**
   * Create price history entry for new pricing
   */
  static createInitialEntry(servicePricingId: string, priceType: PriceType, initialPrice: number): Partial<PriceHistory> {
    return {
      servicePricingId,
      priceType,
      oldPrice: null,
      newPrice: initialPrice,
      changeReason: ChangeReason.INITIAL_SETUP,
      percentageChange: 0,
      isAutomatic: true,
      effectiveDate: new Date(),
      notes: 'Początkowe ustawienie ceny'
    };
  }

  /**
   * Create price history entry for price update
   */
  static createUpdateEntry(
    servicePricingId: string, 
    priceType: PriceType,
    oldPrice: number, 
    newPrice: number,
    reason: ChangeReason,
    userId?: string,
    userName?: string,
    notes?: string
  ): Partial<PriceHistory> {
    const percentageChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
    
    return {
      servicePricingId,
      priceType,
      oldPrice,
      newPrice,
      changeReason: reason,
      percentageChange,
      isAutomatic: false,
      changedByUserId: userId,
      changedByUserName: userName,
      effectiveDate: new Date(),
      notes
    };
  }
}