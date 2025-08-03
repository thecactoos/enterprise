import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ItemType } from '../invoice-item.entity';

export class CreateInvoiceItemDto {
  @ApiProperty({
    description: 'Type of item',
    enum: ItemType,
    example: ItemType.SERVICE
  })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({
    description: 'Service ID if item is a service',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({
    description: 'Product ID if item is a product',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 25.5
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'm²'
  })
  @IsString()
  unit: string;

  @ApiProperty({
    description: 'Unit price net (without VAT) in PLN',
    example: 45.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPriceNet: number;

  @ApiProperty({
    description: 'VAT rate percentage',
    example: 23.00
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  vatRate: number;

  @ApiProperty({
    description: 'Pricing tier used for calculation (for services)',
    example: 'standard',
    required: false
  })
  @IsOptional()
  @IsString()
  pricingTier?: string;

  @ApiProperty({
    description: 'Regional zone used for pricing (for services)',
    example: 'warsaw',
    required: false
  })
  @IsOptional()
  @IsString()
  regionalZone?: string;

  @ApiProperty({
    description: 'Discount percentage applied',
    example: 10.00,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number = 0;

  @ApiProperty({
    description: 'Discount amount in PLN (alternative to percentage)',
    example: 50.00,
    default: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number = 0;

  @ApiProperty({
    description: 'Item sequence/line number on invoice',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lineNumber?: number;
}

// DTO for adding service to invoice with advanced pricing
export class AddServiceToInvoiceDto {
  @ApiProperty({
    description: 'Service ID from services service',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsString()
  serviceId: string;

  @ApiProperty({
    description: 'Quantity of service',
    example: 25.5
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({
    description: 'Pricing tier',
    example: 'standard',
    default: 'standard',
    required: false
  })
  @IsOptional()
  @IsString()
  pricingTier?: string = 'standard';

  @ApiProperty({
    description: 'Regional zone for pricing',
    example: 'warsaw',
    default: 'other',
    required: false
  })
  @IsOptional()
  @IsString()
  regionalZone?: string = 'other';

  @ApiProperty({
    description: 'Apply seasonal adjustment',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  applySeasonalAdjustment?: boolean = false;

  @ApiProperty({
    description: 'Custom discount percentage override',
    example: 5.0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  customDiscountPercent?: number;

  @ApiProperty({
    description: 'Line number for ordering',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lineNumber?: number;
}

// DTO for adding product to invoice
export class AddProductToInvoiceDto {
  @ApiProperty({
    description: 'Product ID from products service',
    example: '123e4567-e89b-12d3-a456-426614174003'
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity of product',
    example: 100
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({
    description: 'Use optimal pricing if available',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  useOptimalPricing?: boolean = false;

  @ApiProperty({
    description: 'Custom discount percentage',
    example: 10.0,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  discountPercent?: number;

  @ApiProperty({
    description: 'Line number for ordering',
    example: 2,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  lineNumber?: number;
}