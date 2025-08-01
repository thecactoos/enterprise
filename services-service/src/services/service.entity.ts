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

  // Helper method to calculate total price for given area
  calculateTotalPrice(areaM2: number): number {
    const baseTotal = this.basePricePerM2 * areaM2;
    return Math.max(baseTotal, this.minimumCharge);
  }

  // Helper method to calculate total time for given area
  calculateTotalTime(areaM2: number): number {
    return this.timePerM2Minutes * areaM2;
  }
}