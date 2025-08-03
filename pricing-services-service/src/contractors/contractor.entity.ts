import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsEmail, IsPhoneNumber, Min, Max, IsNumber } from 'class-validator';
import { ServicePricing } from '../pricing/service-pricing.entity';

export enum ContractorType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  SUBCONTRACTOR = 'subcontractor'
}

export enum ContractorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export enum SkillLevel {
  JUNIOR = 1,
  REGULAR = 2,
  EXPERIENCED = 3,
  EXPERT = 4,
  MASTER = 5
}

export enum RegionalZone {
  WARSAW = 'warsaw',
  KRAKOW = 'krakow',
  GDANSK = 'gdansk',
  WROCLAW = 'wroclaw',
  POZNAN = 'poznan',
  KATOWICE = 'katowice',
  LUBLIN = 'lublin',
  OTHER = 'other'
}

@Entity('contractors')
@Index(['nip'], { unique: true, where: 'nip IS NOT NULL' })
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['contractorType'])
@Index(['regionalZone'])
export class Contractor {
  @ApiProperty({ 
    description: 'Unique contractor identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    description: 'Contractor name or company name',
    example: 'Jan Kowalski Usługi Podłogowe'
  })
  @Column({ name: 'contractor_name', type: 'varchar', length: 255 })
  @IsString()
  contractorName: string;

  @ApiProperty({ 
    description: 'Contractor type',
    enum: ContractorType,
    example: ContractorType.INDIVIDUAL
  })
  @Column({ 
    name: 'contractor_type',
    type: 'enum', 
    enum: ContractorType 
  })
  @IsEnum(ContractorType)
  contractorType: ContractorType;

  @ApiProperty({ 
    description: 'Contact email address',
    example: 'jan.kowalski@example.com'
  })
  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Contact phone number',
    example: '+48123456789',
    required: false
  })
  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber('PL')
  phone?: string;

  @ApiProperty({ 
    description: 'Polish NIP number for companies',
    example: '1234567890',
    required: false
  })
  @Column({ name: 'nip', type: 'varchar', length: 13, nullable: true, unique: true })
  @IsOptional()
  @IsString()
  nip?: string;

  @ApiProperty({ 
    description: 'Polish REGON number',
    example: '123456789',
    required: false
  })
  @Column({ name: 'regon', type: 'varchar', length: 14, nullable: true })
  @IsOptional()
  @IsString()
  regon?: string;

  @ApiProperty({ 
    description: 'Business address',
    example: 'ul. Przykładowa 123, 00-001 Warszawa',
    required: false
  })
  @Column({ name: 'address', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    description: 'Primary regional zone where contractor operates',
    enum: RegionalZone,
    example: RegionalZone.WARSAW
  })
  @Column({ 
    name: 'regional_zone',
    type: 'enum', 
    enum: RegionalZone,
    default: RegionalZone.OTHER
  })
  @IsEnum(RegionalZone)
  regionalZone: RegionalZone;

  @ApiProperty({ 
    description: 'Overall skill level (1-5)',
    example: 4
  })
  @Column({ 
    name: 'skill_level',
    type: 'integer',
    default: 3
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  skillLevel: SkillLevel;

  @ApiProperty({ 
    description: 'Years of experience',
    example: 8
  })
  @Column({ 
    name: 'years_experience',
    type: 'integer',
    default: 0
  })
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience: number;

  @ApiProperty({ 
    description: 'Average rating from previous jobs (1-5)',
    example: 4.7
  })
  @Column({ 
    name: 'average_rating',
    type: 'decimal', 
    precision: 3, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5)
  averageRating: number;

  @ApiProperty({ 
    description: 'Total number of completed jobs',
    example: 156
  })
  @Column({ 
    name: 'jobs_completed',
    type: 'integer',
    default: 0
  })
  @IsNumber()
  @Min(0)
  jobsCompleted: number;

  @ApiProperty({ 
    description: 'Contractor status',
    enum: ContractorStatus,
    example: ContractorStatus.ACTIVE
  })
  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: ContractorStatus,
    default: ContractorStatus.PENDING_VERIFICATION
  })
  @IsEnum(ContractorStatus)
  status: ContractorStatus;

  @ApiProperty({ 
    description: 'Base hourly rate in PLN',
    example: 85.00
  })
  @Column({ 
    name: 'base_hourly_rate',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseHourlyRate: number;

  @ApiProperty({ 
    description: 'Minimum job charge in PLN',
    example: 300.00
  })
  @Column({ 
    name: 'minimum_job_charge',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumJobCharge: number;

  @ApiProperty({ 
    description: 'Travel cost per kilometer in PLN',
    example: 2.50
  })
  @Column({ 
    name: 'travel_cost_per_km',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  travelCostPerKm: number;

  @ApiProperty({ 
    description: 'Maximum travel distance in kilometers',
    example: 50
  })
  @Column({ 
    name: 'max_travel_distance',
    type: 'integer',
    default: 0
  })
  @IsNumber()
  @Min(0)
  maxTravelDistance: number;

  @ApiProperty({ 
    description: 'Contractor specializations (comma-separated)',
    example: 'wood_installation,laminate_installation,vinyl_installation',
    required: false
  })
  @Column({ name: 'specializations', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  specializations?: string;

  @ApiProperty({ 
    description: 'Additional notes about contractor',
    required: false
  })
  @Column({ name: 'notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Contractor registration date',
    example: '2024-01-15T10:30:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Last profile update date',
    example: '2024-01-20T14:45:00Z'
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ServicePricing, (pricing) => pricing.contractor)
  servicePricing: ServicePricing[];

  // Computed properties
  @ApiProperty({ 
    description: 'Formatted contractor display name',
    example: '🏆 Jan Kowalski Usługi Podłogowe (⭐ 4.7)'
  })
  get displayName(): string {
    const skillEmoji = this.getSkillEmoji();
    const rating = this.averageRating > 0 ? ` (⭐ ${this.averageRating})` : '';
    return `${skillEmoji} ${this.contractorName}${rating}`;
  }

  @ApiProperty({ 
    description: 'Formatted hourly rate with currency',
    example: '85,00 PLN/h'
  })
  get formattedHourlyRate(): string {
    return `${this.baseHourlyRate.toFixed(2).replace('.', ',')} PLN/h`;
  }

  @ApiProperty({ 
    description: 'Contractor experience level description',
    example: 'Expert - 8 years experience'
  })
  get experienceDescription(): string {
    const levelNames = {
      1: 'Junior',
      2: 'Regular', 
      3: 'Experienced',
      4: 'Expert',
      5: 'Master'
    };
    return `${levelNames[this.skillLevel]} - ${this.yearsExperience} lat doświadczenia`;
  }

  private getSkillEmoji(): string {
    switch (this.skillLevel) {
      case 1: return '🌱'; // Junior
      case 2: return '⚡'; // Regular
      case 3: return '🔥'; // Experienced
      case 4: return '🏆'; // Expert
      case 5: return '👑'; // Master
      default: return '🔧';
    }
  }

  /**
   * Get specializations as array
   */
  getSpecializationsArray(): string[] {
    return this.specializations ? this.specializations.split(',').map(s => s.trim()) : [];
  }

  /**
   * Check if contractor specializes in specific service category
   */
  hasSpecialization(category: string): boolean {
    const specializations = this.getSpecializationsArray();
    return specializations.includes(category);
  }

  /**
   * Calculate effective hourly rate based on complexity and urgency
   */
  calculateEffectiveRate(complexityMultiplier: number = 1.0, urgencyMultiplier: number = 1.0): number {
    let rate = this.baseHourlyRate;
    
    // Apply skill level bonus
    const skillBonus = (this.skillLevel - 1) * 0.1; // 0-40% bonus
    rate *= (1 + skillBonus);
    
    // Apply complexity and urgency multipliers
    rate *= complexityMultiplier * urgencyMultiplier;
    
    return Math.round(rate * 100) / 100;
  }

  /**
   * Check if contractor is available for work
   */
  isAvailable(): boolean {
    return this.status === ContractorStatus.ACTIVE;
  }
}