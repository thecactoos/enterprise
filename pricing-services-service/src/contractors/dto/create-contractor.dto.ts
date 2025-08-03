import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsEmail, IsPhoneNumber, Min, Max, IsNumber } from 'class-validator';
import { ContractorType, ContractorStatus, SkillLevel, RegionalZone } from '../contractor.entity';

export class CreateContractorDto {
  @ApiProperty({ 
    description: 'Contractor name or company name',
    example: 'Jan Kowalski Usługi Podłogowe'
  })
  @IsString()
  contractorName: string;

  @ApiProperty({ 
    description: 'Contractor type',
    enum: ContractorType,
    example: ContractorType.INDIVIDUAL
  })
  @IsEnum(ContractorType)
  contractorType: ContractorType;

  @ApiProperty({ 
    description: 'Contact email address',
    example: 'jan.kowalski@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Contact phone number',
    example: '+48123456789',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber('PL')
  phone?: string;

  @ApiProperty({ 
    description: 'Polish NIP number for companies',
    example: '1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  nip?: string;

  @ApiProperty({ 
    description: 'Polish REGON number',
    example: '123456789',
    required: false
  })
  @IsOptional()
  @IsString()
  regon?: string;

  @ApiProperty({ 
    description: 'Business address',
    example: 'ul. Przykładowa 123, 00-001 Warszawa',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    description: 'Primary regional zone where contractor operates',
    enum: RegionalZone,
    example: RegionalZone.WARSAW,
    default: RegionalZone.OTHER
  })
  @IsOptional()
  @IsEnum(RegionalZone)
  regionalZone?: RegionalZone = RegionalZone.OTHER;

  @ApiProperty({ 
    description: 'Overall skill level (1-5)',
    example: 3,
    default: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  skillLevel?: SkillLevel = 3;

  @ApiProperty({ 
    description: 'Years of experience',
    example: 5,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience?: number = 0;

  @ApiProperty({ 
    description: 'Base hourly rate in PLN',
    example: 75.00,
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseHourlyRate?: number = 0;

  @ApiProperty({ 
    description: 'Minimum job charge in PLN',
    example: 250.00,
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumJobCharge?: number = 0;

  @ApiProperty({ 
    description: 'Travel cost per kilometer in PLN',
    example: 2.00,
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  travelCostPerKm?: number = 0;

  @ApiProperty({ 
    description: 'Maximum travel distance in kilometers',
    example: 30,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTravelDistance?: number = 0;

  @ApiProperty({ 
    description: 'Contractor specializations (comma-separated)',
    example: 'wood_installation,laminate_installation,vinyl_installation',
    required: false
  })
  @IsOptional()
  @IsString()
  specializations?: string;

  @ApiProperty({ 
    description: 'Additional notes about contractor',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}