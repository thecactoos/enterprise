import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  Min, 
  Max, 
  IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PricingTier, RegionalZone } from '../service.entity';

export class PricingCalculationDto {
  @ApiProperty({ 
    description: 'Quantity to calculate pricing for (m², hours, days, rooms)',
    example: 50.5,
    minimum: 0.01
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ 
    description: 'Pricing tier to use for calculation',
    enum: PricingTier,
    example: PricingTier.STANDARD,
    required: false
  })
  @IsOptional()
  @IsEnum(PricingTier)
  tier?: PricingTier;

  @ApiProperty({ 
    description: 'Regional zone for pricing adjustments',
    enum: RegionalZone,
    example: RegionalZone.WARSAW,
    required: false
  })
  @IsOptional()
  @IsEnum(RegionalZone)
  regionalZone?: RegionalZone;

  @ApiProperty({ 
    description: 'Override seasonal adjustment',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  applySeasonalAdjustment?: boolean;
}

export class BulkPricingUpdateDto {
  @ApiProperty({ 
    description: 'Array of service IDs to update',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    type: [String]
  })
  serviceIds: string[];

  @ApiProperty({ 
    description: 'Percentage adjustment to apply to base prices (-50 to 100)',
    example: 10.5,
    minimum: -50,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-50)
  @Max(100)
  priceAdjustmentPercent?: number;

  @ApiProperty({ 
    description: 'New VAT rate to apply',
    example: 23,
    enum: [0, 8, 23],
    required: false
  })
  @IsOptional()
  @IsEnum([0, 8, 23])
  newVatRate?: number;

  @ApiProperty({ 
    description: 'New seasonal multiplier',
    example: 1.1,
    minimum: 0.8,
    maximum: 1.3,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.8)
  @Max(1.3)
  seasonalMultiplier?: number;

  @ApiProperty({ 
    description: 'Enable/disable seasonal adjustment',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  seasonalAdjustmentActive?: boolean;

  @ApiProperty({ 
    description: 'New regional multiplier',
    example: 1.15,
    minimum: 0.5,
    maximum: 2.0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.5)
  @Max(2.0)
  regionalMultiplier?: number;
}

export class RegionalPricingDto {
  @ApiProperty({ 
    description: 'Regional zone',
    enum: RegionalZone,
    example: RegionalZone.WARSAW
  })
  @IsEnum(RegionalZone)
  regionalZone: RegionalZone;

  @ApiProperty({ 
    description: 'Price multiplier for this region',
    example: 1.25,
    minimum: 0.5,
    maximum: 2.0
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.5)
  @Max(2.0)
  multiplier: number;
}

export class SeasonalAdjustmentDto {
  @ApiProperty({ 
    description: 'Seasonal multiplier to apply',
    example: 1.1,
    minimum: 0.8,
    maximum: 1.3
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.8)
  @Max(1.3)
  multiplier: number;

  @ApiProperty({ 
    description: 'Enable seasonal adjustment',
    example: true
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ 
    description: 'Array of service category names to apply adjustment to',
    example: ['wood_glue', 'laminate_click'],
    type: [String],
    required: false
  })
  @IsOptional()
  categories?: string[];
}

export class PricingTierUpdateDto {
  @ApiProperty({ 
    description: 'Basic tier price (basePricePerM2)',
    example: 40.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basicPrice?: number;

  @ApiProperty({ 
    description: 'Standard tier price (15% above basic)',
    example: 46.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  standardPrice?: number;

  @ApiProperty({ 
    description: 'Premium tier price (25% above basic)',
    example: 50.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  premiumPrice?: number;

  @ApiProperty({ 
    description: 'Hourly rate for hourly pricing model',
    example: 80.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ 
    description: 'Daily rate for daily pricing model',
    example: 600.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyRate?: number;
}

export class VolumeDiscountDto {
  @ApiProperty({ 
    description: 'Volume threshold to qualify for discount',
    example: 50,
    minimum: 1
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  threshold: number;

  @ApiProperty({ 
    description: 'Discount percentage (0-30%)',
    example: 10,
    minimum: 0,
    maximum: 30
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  discountPercent: number;
}