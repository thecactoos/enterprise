import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';

// Enums for service categorization
export enum ServiceCategory {
  WOOD_GLUE = 'wood_glue',
  WOOD_CLICK = 'wood_click',
  LAMINATE_GLUE = 'laminate_glue', 
  LAMINATE_CLICK = 'laminate_click',
  VINYL_GLUE = 'vinyl_glue',
  VINYL_CLICK = 'vinyl_click',
  TRANSPORT = 'transport',
  BASEBOARDS = 'baseboards'
}

export enum Material {
  WOOD = 'drewno',
  LAMINATE = 'laminat',
  VINYL = 'winyl',
  TRANSPORT = 'transport',
  MDF_BASEBOARD = 'listwa_mdf',
  PLASTIC_BASEBOARD = 'listwa_tworzywowa',
  DOLLKEN_BASEBOARD = 'listwa_dollken',
  WENEV_BASEBOARD = 'listwa_wenev'
}

export enum InstallationMethod {
  GLUE = 'klej',
  CLICK = 'click',
  TRANSPORT = 'transport',
  BASEBOARD_INSTALL = 'montaż_listwy'
}

export enum FlooringForm {
  PARQUET = 'parkiet',
  PLANK = 'deska',
  TRANSPORT = 'transport',
  BASEBOARD = 'listwa'
}

export enum Pattern {
  IRREGULAR = 'nieregularnie',
  REGULAR = 'regularnie',
  CLASSIC_HERRINGBONE = 'jodła_klasyczna',
  FRENCH_HERRINGBONE = 'jodła_francuska',
  REGULAR_IPA = 'regularnie_ipa',
  CLASSIC_BERRY_ALLOC = 'jodła_klasyczna_berry_alloc',
  CLASSIC_BARLINEK = 'jodła_klasyczna_barlinek',
  FRENCH_BARLINEK = 'jodła_francuska_barlinek',
  CLASSIC_ARBITON = 'jodła_klasyczna_arbiton',
  FRENCH_ARBITON = 'jodła_francuska_arbiton',
  CLASSIC_UNIZIP = 'jodła_klasyczna_unizip',
  TRANSPORT = 'transport',
  BASEBOARD_10CM = 'listwa_10cm',
  BASEBOARD_12CM = 'listwa_12cm',
  BASEBOARD_15CM = 'listwa_15cm',
  BASEBOARD_DOLLKEN = 'listwa_dollken',
  BASEBOARD_WENEV = 'listwa_wenev'
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

export enum PricingTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium'
}

export enum PricingModel {
  PER_M2 = 'per_m2',
  HOURLY = 'hourly',
  DAILY = 'daily',
  PROJECT = 'project',
  PER_ROOM = 'per_room'
}

export enum VatRate {
  STANDARD = 23, // Standard VAT rate for most services
  REDUCED = 8,   // Reduced VAT for specific construction services
  ZERO = 0       // Zero VAT for exports/specific cases
}

export enum RegionalZone {
  WARSAW = 'warsaw',
  KRAKOW = 'krakow',
  GDANSK = 'gdansk',
  WROCLAW = 'wroclaw',
  POZNAN = 'poznan',
  OTHER = 'other'
}

@Entity('services')
@Index(['category', 'status'])
@Index(['material', 'installationMethod'])
@Index(['serviceCode'], { unique: true })
export class Service {
  @ApiProperty({ 
    description: 'Unique service identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Unique service code for identification',
    example: 'WOOD_GLUE_PARQUET_IRREGULAR'
  })
  @Column({ name: 'service_code', type: 'varchar', length: 100, unique: true })
  @IsString()
  serviceCode: string;

  @ApiProperty({ 
    description: 'Service display name',
    example: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie'
  })
  @Column({ name: 'service_name', type: 'varchar', length: 255 })
  @IsString()
  serviceName: string;

  @ApiProperty({ 
    description: 'Service category',
    enum: ServiceCategory,
    example: ServiceCategory.WOOD_GLUE
  })
  @Column({ 
    name: 'category',
    type: 'enum', 
    enum: ServiceCategory 
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({ 
    description: 'Material type',
    enum: Material,
    example: Material.WOOD
  })
  @Column({ 
    name: 'material',
    type: 'enum', 
    enum: Material 
  })
  @IsEnum(Material)
  material: Material;

  @ApiProperty({ 
    description: 'Installation method',
    enum: InstallationMethod,
    example: InstallationMethod.GLUE
  })
  @Column({ 
    name: 'installation_method',
    type: 'enum', 
    enum: InstallationMethod 
  })
  @IsEnum(InstallationMethod)
  installationMethod: InstallationMethod;

  @ApiProperty({ 
    description: 'Flooring form',
    enum: FlooringForm,
    example: FlooringForm.PARQUET
  })
  @Column({ 
    name: 'flooring_form',
    type: 'enum', 
    enum: FlooringForm 
  })
  @IsEnum(FlooringForm)
  flooringForm: FlooringForm;

  @ApiProperty({ 
    description: 'Installation pattern',
    enum: Pattern,
    example: Pattern.IRREGULAR
  })
  @Column({ 
    name: 'pattern',
    type: 'enum', 
    enum: Pattern 
  })
  @IsEnum(Pattern)
  pattern: Pattern;

  @ApiProperty({ 
    description: 'Service description',
    example: 'Professional installation of wooden flooring using adhesive method'
  })
  @Column({ name: 'description', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Base price per square meter in PLN',
    example: 45.50
  })
  @Column({ 
    name: 'base_price_per_m2',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePricePerM2: number;

  @ApiProperty({ 
    description: 'Minimum charge for the service in PLN',
    example: 200.00
  })
  @Column({ 
    name: 'minimum_charge',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumCharge: number;

  @ApiProperty({ 
    description: 'Estimated time per square meter in minutes',
    example: 30
  })
  @Column({ 
    name: 'time_per_m2_minutes',
    type: 'integer',
    default: 0
  })
  @IsNumber()
  @Min(0)
  @Max(1440) // Max 24 hours per m2
  timePerM2Minutes: number;

  @ApiProperty({ 
    description: 'Required skill level (1-5)',
    example: 3
  })
  @Column({ 
    name: 'skill_level',
    type: 'integer',
    default: 1
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  skillLevel: number;

  @ApiProperty({ 
    description: 'Service status',
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE
  })
  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE
  })
  @IsEnum(ServiceStatus)
  status: ServiceStatus;

  // ==================== ADVANCED PRICING FIELDS ====================
  
  @ApiProperty({ 
    description: 'Pricing tier level',
    enum: PricingTier,
    example: PricingTier.STANDARD
  })
  @Column({ 
    name: 'pricing_tier',
    type: 'enum', 
    enum: PricingTier,
    default: PricingTier.STANDARD
  })
  @IsEnum(PricingTier)
  pricingTier: PricingTier;

  @ApiProperty({ 
    description: 'Pricing model for calculations',
    enum: PricingModel,
    example: PricingModel.PER_M2
  })
  @Column({ 
    name: 'pricing_model',
    type: 'enum', 
    enum: PricingModel,
    default: PricingModel.PER_M2
  })
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @ApiProperty({ 
    description: 'Polish VAT rate percentage',
    enum: VatRate,
    example: VatRate.STANDARD
  })
  @Column({ 
    name: 'vat_rate',
    type: 'enum', 
    enum: VatRate,
    default: VatRate.STANDARD
  })
  @IsEnum(VatRate)
  vatRate: VatRate;

  @ApiProperty({ 
    description: 'Standard tier price per unit',
    example: 45.50
  })
  @Column({ 
    name: 'standard_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  standardPrice: number;

  @ApiProperty({ 
    description: 'Premium tier price per unit (15-25% higher)',
    example: 52.33
  })
  @Column({ 
    name: 'premium_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  premiumPrice: number;

  @ApiProperty({ 
    description: 'Hourly rate for hourly pricing model',
    example: 80.00
  })
  @Column({ 
    name: 'hourly_rate',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate: number;

  @ApiProperty({ 
    description: 'Daily rate for daily pricing model',
    example: 600.00
  })
  @Column({ 
    name: 'daily_rate',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyRate: number;

  @ApiProperty({ 
    description: 'Volume discount threshold (m² or units)',
    example: 50
  })
  @Column({ 
    name: 'volume_threshold',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  volumeThreshold: number;

  @ApiProperty({ 
    description: 'Volume discount percentage (0-30%)',
    example: 10
  })
  @Column({ 
    name: 'volume_discount_percent',
    type: 'decimal', 
    precision: 5, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(30)
  volumeDiscountPercent: number;

  @ApiProperty({ 
    description: 'Regional price multiplier for different zones',
    example: 1.15
  })
  @Column({ 
    name: 'regional_multiplier',
    type: 'decimal', 
    precision: 5, 
    scale: 3,
    default: 1.0
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.5)
  @Max(2.0)
  regionalMultiplier: number;

  @ApiProperty({ 
    description: 'Seasonal price adjustment active',
    example: false
  })
  @Column({ 
    name: 'seasonal_adjustment_active',
    type: 'boolean',
    default: false
  })
  seasonalAdjustmentActive: boolean;

  @ApiProperty({ 
    description: 'Seasonal price multiplier (0.8-1.3)',
    example: 1.1
  })
  @Column({ 
    name: 'seasonal_multiplier',
    type: 'decimal', 
    precision: 5, 
    scale: 3,
    default: 1.0
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.8)
  @Max(1.3)
  seasonalMultiplier: number;

  @ApiProperty({ 
    description: 'Service creation date',
    example: '2024-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Service last update date',
    example: '2024-01-20T14:45:00Z'
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  @ApiProperty({ 
    description: 'Formatted display name with emoji',
    example: '🪵 Montaż podłogi drewnianej na klej - parkiet nieregularnie'
  })
  get displayName(): string {
    const emoji = this.getCategoryEmoji();
    return `${emoji} ${this.serviceName}`;
  }

  @ApiProperty({ 
    description: 'Formatted price display',
    example: '45,50 PLN/m²'
  })
  get formattedPrice(): string {
    return `${this.basePricePerM2.toFixed(2).replace('.', ',')} PLN/m²`;
  }

  @ApiProperty({ 
    description: 'Estimated time display',
    example: '30 min/m²'
  })
  get formattedTime(): string {
    if (this.timePerM2Minutes >= 60) {
      const hours = Math.floor(this.timePerM2Minutes / 60);
      const minutes = this.timePerM2Minutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min/m²` : `${hours}h/m²`;
    }
    return `${this.timePerM2Minutes} min/m²`;
  }

  private getCategoryEmoji(): string {
    switch (this.category) {
      case ServiceCategory.WOOD_GLUE:
      case ServiceCategory.WOOD_CLICK:
        return '🪵';
      case ServiceCategory.LAMINATE_GLUE:
      case ServiceCategory.LAMINATE_CLICK:
        return '🧱';
      case ServiceCategory.VINYL_GLUE:
      case ServiceCategory.VINYL_CLICK:
        return '💿';
      case ServiceCategory.TRANSPORT:
        return '📦';
      case ServiceCategory.BASEBOARDS:
        return '🪚';
      default:
        return '🔧';
    }
  }

  // ==================== ENHANCED PRICING CALCULATIONS ====================
  
  /**
   * Calculate price based on tier and quantity
   * @param quantity - Amount (m², hours, days, rooms)
   * @param tier - Pricing tier (basic, standard, premium)
   * @param regionalZone - Regional zone for pricing adjustments
   * @returns Price calculation with VAT breakdown
   */
  calculateAdvancedPrice(quantity: number, tier: PricingTier = this.pricingTier, regionalZone: RegionalZone = RegionalZone.OTHER): {
    netPrice: number;
    vatAmount: number;
    grossPrice: number;
    discountApplied: number;
    effectiveRate: number;
  } {
    let baseRate = this.getBasePriceForTier(tier);
    
    // Apply regional multiplier
    const regionalMultiplier = this.getRegionalMultiplier(regionalZone);
    baseRate *= regionalMultiplier;
    
    // Apply seasonal adjustment if active
    if (this.seasonalAdjustmentActive) {
      baseRate *= this.seasonalMultiplier;
    }
    
    let netPrice = baseRate * quantity;
    
    // Apply volume discount if applicable
    let discountApplied = 0;
    if (quantity >= this.volumeThreshold && this.volumeDiscountPercent > 0) {
      discountApplied = (netPrice * this.volumeDiscountPercent) / 100;
      netPrice -= discountApplied;
    }
    
    // Ensure minimum charge is met
    netPrice = Math.max(netPrice, this.minimumCharge);
    
    // Calculate VAT
    const vatAmount = (netPrice * this.vatRate) / 100;
    const grossPrice = netPrice + vatAmount;
    
    return {
      netPrice: Math.round(netPrice * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossPrice: Math.round(grossPrice * 100) / 100,
      discountApplied: Math.round(discountApplied * 100) / 100,
      effectiveRate: Math.round(baseRate * 100) / 100
    };
  }
  
  /**
   * Get base price for specific tier
   */
  private getBasePriceForTier(tier: PricingTier): number {
    switch (tier) {
      case PricingTier.BASIC:
        return this.basePricePerM2;
      case PricingTier.STANDARD:
        return this.standardPrice || this.basePricePerM2 * 1.15;
      case PricingTier.PREMIUM:
        return this.premiumPrice || this.basePricePerM2 * 1.25;
      default:
        return this.basePricePerM2;
    }
  }
  
  /**
   * Get regional multiplier for different Polish cities/zones
   */
  private getRegionalMultiplier(zone: RegionalZone): number {
    const regionalMultipliers = {
      [RegionalZone.WARSAW]: 1.25,    // Highest prices
      [RegionalZone.KRAKOW]: 1.15,    // High prices
      [RegionalZone.GDANSK]: 1.10,    // Medium-high prices
      [RegionalZone.WROCLAW]: 1.08,   // Medium prices
      [RegionalZone.POZNAN]: 1.05,    // Slightly above average
      [RegionalZone.OTHER]: 1.00      // Base price
    };
    
    return regionalMultipliers[zone] || this.regionalMultiplier;
  }
  
  /**
   * Calculate price for different pricing models
   */
  calculateByPricingModel(quantity: number, tier: PricingTier = this.pricingTier): number {
    switch (this.pricingModel) {
      case PricingModel.PER_M2:
        return this.calculateAdvancedPrice(quantity, tier).grossPrice;
      case PricingModel.HOURLY:
        return this.hourlyRate * quantity * (1 + this.vatRate / 100);
      case PricingModel.DAILY:
        return this.dailyRate * quantity * (1 + this.vatRate / 100);
      case PricingModel.PROJECT:
        return this.minimumCharge * (1 + this.vatRate / 100); // Flat project rate
      case PricingModel.PER_ROOM:
        return this.basePricePerM2 * 15 * quantity * (1 + this.vatRate / 100); // Assuming 15m² per room
      default:
        return this.calculateAdvancedPrice(quantity, tier).grossPrice;
    }
  }
  
  /**
   * Legacy method - maintained for backward compatibility
   */
  calculateTotalPrice(areaM2: number): number {
    return this.calculateAdvancedPrice(areaM2).grossPrice;
  }

  /**
   * Legacy method - maintained for backward compatibility
   */
  calculateTotalTime(areaM2: number): number {
    return this.timePerM2Minutes * areaM2;
  }
  
  /**
   * Generate pricing summary for quotations
   */
  getPricingSummary(quantity: number, tier: PricingTier = this.pricingTier, regionalZone: RegionalZone = RegionalZone.OTHER): {
    serviceName: string;
    quantity: number;
    unit: string;
    tier: string;
    netPrice: number;
    vatRate: number;
    vatAmount: number;
    grossPrice: number;
    discountApplied: number;
    priceBreakdown: string[];
  } {
    const calculation = this.calculateAdvancedPrice(quantity, tier, regionalZone);
    const unit = this.getPricingUnit();
    
    const priceBreakdown = [
      `Base rate: ${calculation.effectiveRate.toFixed(2)} PLN/${unit}`,
      `Quantity: ${quantity} ${unit}`,
      ...(calculation.discountApplied > 0 ? [`Volume discount: -${calculation.discountApplied.toFixed(2)} PLN`] : []),
      `Net price: ${calculation.netPrice.toFixed(2)} PLN`,
      `VAT (${this.vatRate}%): ${calculation.vatAmount.toFixed(2)} PLN`
    ];
    
    return {
      serviceName: this.serviceName,
      quantity,
      unit,
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      netPrice: calculation.netPrice,
      vatRate: this.vatRate,
      vatAmount: calculation.vatAmount,
      grossPrice: calculation.grossPrice,
      discountApplied: calculation.discountApplied,
      priceBreakdown
    };
  }
  
  private getPricingUnit(): string {
    switch (this.pricingModel) {
      case PricingModel.PER_M2: return 'm²';
      case PricingModel.HOURLY: return 'hour';
      case PricingModel.DAILY: return 'day';
      case PricingModel.PROJECT: return 'project';
      case PricingModel.PER_ROOM: return 'room';
      default: return 'm²';
    }
  }
}