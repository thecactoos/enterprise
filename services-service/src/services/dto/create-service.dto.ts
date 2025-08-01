import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  Min, 
  Max,
  MinLength,
  MaxLength 
} from 'class-validator';
import {
  ServiceCategory,
  Material,
  InstallationMethod,
  FlooringForm,
  Pattern,
  ServiceStatus
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
}