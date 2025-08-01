import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsString, 
  IsNumber, 
  Min, 
  Max
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ServiceCategory,
  Material,
  InstallationMethod,
  FlooringForm,
  Pattern,
  ServiceStatus
} from '../service.entity';

export class ServiceQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Filter by service category',
    enum: ServiceCategory,
    required: false
  })
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @ApiProperty({ 
    description: 'Filter by material type',
    enum: Material,
    required: false
  })
  @IsOptional()
  @IsEnum(Material)
  material?: Material;

  @ApiProperty({ 
    description: 'Filter by installation method',
    enum: InstallationMethod,
    required: false
  })
  @IsOptional()
  @IsEnum(InstallationMethod)
  installationMethod?: InstallationMethod;

  @ApiProperty({ 
    description: 'Filter by flooring form',
    enum: FlooringForm,
    required: false
  })
  @IsOptional()
  @IsEnum(FlooringForm)
  flooringForm?: FlooringForm;

  @ApiProperty({ 
    description: 'Filter by pattern',
    enum: Pattern,
    required: false
  })
  @IsOptional()
  @IsEnum(Pattern)
  pattern?: Pattern;

  @ApiProperty({ 
    description: 'Filter by service status',
    enum: ServiceStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiProperty({ 
    description: 'Search in service name and description',
    example: 'montaż drewno',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Minimum price per m2 filter',
    example: 10.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiProperty({ 
    description: 'Maximum price per m2 filter',
    example: 100.00,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ 
    description: 'Minimum skill level filter (1-5)',
    example: 1,
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minSkillLevel?: number;

  @ApiProperty({ 
    description: 'Maximum skill level filter (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxSkillLevel?: number;

  @ApiProperty({ 
    description: 'Sort field',
    example: 'serviceName',
    enum: ['serviceName', 'basePricePerM2', 'timePerM2Minutes', 'skillLevel', 'createdAt'],
    required: false
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}