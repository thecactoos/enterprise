import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  Min, 
  Max,
  MinLength,
  MaxLength,
  IsBoolean 
} from 'class-validator';
import {
  ServiceCategory,
  Material,
  InstallationMethod,
  FlooringForm,
  Pattern,
  ServiceStatus,
  PricingTier,
  PricingModel,
  VatRate,
  RegionalZone
} from '../service.entity';

export class CreateServiceDto {
  @ApiProperty({ 
    description: 'Unique service code for identification',
    example: 'WOOD_GLUE_PARQUET_IRREGULAR',
    minLength: 3,
    maxLength: 100
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  serviceCode: string;

  @ApiProperty({ 
    description: 'Service display name',
    example: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie',
    minLength: 5,
    maxLength: 255
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  serviceName: string;

  @ApiProperty({ 
    description: 'Service category',
    enum: ServiceCategory,
    example: ServiceCategory.WOOD_GLUE
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({ 
    description: 'Material type',
    enum: Material,
    example: Material.WOOD
  })
  @IsEnum(Material)
  material: Material;

  @ApiProperty({ 
    description: 'Installation method',
    enum: InstallationMethod,
    example: InstallationMethod.GLUE
  })
  @IsEnum(InstallationMethod)
  installationMethod: InstallationMethod;

  @ApiProperty({ 
    description: 'Flooring form',
    enum: FlooringForm,
    example: FlooringForm.PARQUET
  })
  @IsEnum(FlooringForm)
  flooringForm: FlooringForm;

  @ApiProperty({ 
    description: 'Installation pattern',
    enum: Pattern,
    example: Pattern.IRREGULAR
  })
  @IsEnum(Pattern)
  pattern: Pattern;

  @ApiProperty({ 
    description: 'Service description',
    example: 'Professional installation of wooden flooring using adhesive method',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ 
    description: 'Base price per square meter in PLN',
    example: 45.50,
    minimum: 0,
    maximum: 9999.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  basePricePerM2: number;

  @ApiProperty({ 
    description: 'Minimum charge for the service in PLN',
    example: 200.00,
    minimum: 0,
    maximum: 99999.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999.99)
  minimumCharge: number;

  @ApiProperty({ 
    description: 'Estimated time per square meter in minutes',
    example: 30,
    minimum: 0,
    maximum: 1440
  })
  @IsNumber()
  @Min(0)
  @Max(1440) // Max 24 hours per m2
  timePerM2Minutes: number;

  @ApiProperty({ 
    description: 'Required skill level (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  skillLevel: number;

  @ApiProperty({ 
    description: 'Service status',
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
    required: false
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  // ==================== ADVANCED PRICING FIELDS ====================
  
  @ApiProperty({ 
    description: 'Pricing tier level',
    enum: PricingTier,
    example: PricingTier.STANDARD,
    required: false
  })
  @IsOptional()
  @IsEnum(PricingTier)
  pricingTier?: PricingTier;

  @ApiProperty({ 
    description: 'Pricing model for calculations',
    enum: PricingModel,
    example: PricingModel.PER_M2,
    required: false
  })
  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @ApiProperty({ 
    description: 'Polish VAT rate percentage',
    enum: VatRate,
    example: VatRate.STANDARD,
    required: false
  })
  @IsOptional()
  @IsEnum(VatRate)
  vatRate?: VatRate;

  @ApiProperty({ 
    description: 'Standard tier price per unit (auto-calculated if not provided)',
    example: 52.25,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  standardPrice?: number;

  @ApiProperty({ 
    description: 'Premium tier price per unit (auto-calculated if not provided)',
    example: 56.25,
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

  @ApiProperty({ 
    description: 'Volume discount threshold (m² or units)',
    example: 50,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  volumeThreshold?: number;

  @ApiProperty({ 
    description: 'Volume discount percentage (0-30%)',
    example: 10,
    minimum: 0,
    maximum: 30,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  volumeDiscountPercent?: number;

  @ApiProperty({ 
    description: 'Regional price multiplier',
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

  @ApiProperty({ 
    description: 'Enable seasonal price adjustment',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  seasonalAdjustmentActive?: boolean;

  @ApiProperty({ 
    description: 'Seasonal price multiplier (0.8-1.3)',
    example: 1.0,
    minimum: 0.8,
    maximum: 1.3,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.8)
  @Max(1.3)
  seasonalMultiplier?: number;
}