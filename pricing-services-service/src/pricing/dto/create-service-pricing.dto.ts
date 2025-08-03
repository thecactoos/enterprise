import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsUUID, IsBoolean, IsDateString } from 'class-validator';

export class CreateServicePricingDto {
  @ApiProperty({ 
    description: 'Reference to service from services-service',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ 
    description: 'Contractor providing this pricing',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  contractorId: string;

  @ApiProperty({ 
    description: 'Purchase cost (what we pay to contractor)',
    example: 35.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseCost: number;

  @ApiProperty({ 
    description: 'Sale price (what we charge clients)',
    example: 45.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice: number;

  @ApiProperty({ 
    description: 'Retail price for end customers',
    example: 65.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  retailPrice: number;

  @ApiProperty({ 
    description: 'Currency code',
    example: 'PLN',
    default: 'PLN'
  })
  @IsOptional()
  @IsString()
  currency?: string = 'PLN';

  @ApiProperty({ 
    description: 'Whether this pricing is currently active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ 
    description: 'Date when this pricing becomes effective',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiProperty({ 
    description: 'Date when this pricing expires',
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiProperty({ 
    description: 'Additional notes about this pricing',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}