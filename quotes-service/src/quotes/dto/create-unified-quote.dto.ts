import { IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSelectionDto {
  @ApiProperty({ description: 'Product UUID from products-service' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity of product needed', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Room name where product will be installed' })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({ description: 'Area in m² for this product', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  area?: number;
}

export class RoomCalculationDto {
  @ApiProperty({ description: 'Room name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Room length in meters', minimum: 0.1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  length: number;

  @ApiProperty({ description: 'Room width in meters', minimum: 0.1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)  
  width: number;

  @ApiPropertyOptional({ description: 'Waste percentage for calculations', minimum: 0, maximum: 50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(50)
  wastePercent?: number;
}

export class QuotePreferencesDto {
  @ApiPropertyOptional({ description: 'Include installation services', default: true })
  @IsOptional()
  @IsBoolean()
  includeInstallation?: boolean;

  @ApiPropertyOptional({ description: 'Include transport/delivery service', default: true })
  @IsOptional()
  @IsBoolean()
  includeTransport?: boolean;

  @ApiPropertyOptional({ description: 'Include baseboard installation', default: false })
  @IsOptional()
  @IsBoolean()
  includeBaseboard?: boolean;

  @ApiPropertyOptional({ 
    description: 'Service level preference',
    enum: ['basic', 'standard', 'premium'],
    default: 'standard'
  })
  @IsOptional()
  @IsEnum(['basic', 'standard', 'premium'])
  serviceLevel?: 'basic' | 'standard' | 'premium';
}

export class CreateUnifiedQuoteDto {
  @ApiProperty({ description: 'Contact UUID from contacts-service' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ description: 'Quote title/name' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Quote description/notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Array of products to include in quote',
    type: [ProductSelectionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSelectionDto)
  products: ProductSelectionDto[];

  @ApiPropertyOptional({ 
    description: 'Room dimensions for automatic material calculation',
    type: [RoomCalculationDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomCalculationDto)
  rooms?: RoomCalculationDto[];

  @ApiPropertyOptional({ 
    description: 'Service preferences and options',
    type: QuotePreferencesDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuotePreferencesDto)
  preferences?: QuotePreferencesDto;
}