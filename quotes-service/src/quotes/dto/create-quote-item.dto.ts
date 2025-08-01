import { IsNotEmpty, IsUUID, IsOptional, IsNumber, IsString, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType } from '../entities/quote-item.entity';

export class CreateQuoteItemDto {
  @IsEnum(ItemType)
  @IsNotEmpty()
  @ApiProperty({ enum: ItemType, description: 'Item type (PRODUCT or SERVICE)' })
  itemType: ItemType;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Product ID from products service' })
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Position in the quote', default: 1 })
  position?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product SKU' })
  sku?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Item name' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;

  // Quantities and units
  @IsNumber()
  @IsNotEmpty()
  @Min(0.001)
  @Type(() => Number)
  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ 
    description: 'Unit (m², szt, mb, paczka, usługa)', 
    example: 'm²' 
  })
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Quantity per package' })
  quantityPerPackage?: number;

  // Pricing
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ description: 'Price per unit' })
  pricePerUnit: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Discount percentage', default: 0 })
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'VAT rate', default: 23 })
  vatRate?: number;

  // For area calculations
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Coverage per unit in m²' })
  coveragePerUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Waste percentage for cutting', default: 10 })
  wastePercent?: number;
}