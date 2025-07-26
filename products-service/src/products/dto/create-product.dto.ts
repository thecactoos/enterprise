import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus, BaseUnit, SellingUnit } from '../product.entity';

export class CreateProductDto {
  @ApiProperty({ description: 'External product code', example: '54045', required: false })
  @IsOptional()
  @IsString()
  product_code?: string;

  @ApiProperty({ description: 'Product name', example: '[S] Tarkett Listwa Foliowana Biała' })
  @IsString()
  product_name: string;

  @ApiProperty({ description: 'Base measurement unit', enum: BaseUnit, default: BaseUnit.PIECE })
  @IsOptional()
  @IsEnum(BaseUnit)
  measure_unit?: BaseUnit;

  @ApiProperty({ description: 'Unit for pricing calculations', enum: BaseUnit, default: BaseUnit.PIECE })
  @IsOptional()
  @IsEnum(BaseUnit)
  base_unit_for_pricing?: BaseUnit;

  @ApiProperty({ description: 'Unit for sales', enum: SellingUnit, default: SellingUnit.PIECE })
  @IsOptional()
  @IsEnum(SellingUnit)
  selling_unit?: SellingUnit;

  @ApiProperty({ description: 'Conversion ratio between units', example: 2.5, default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  measurement_units_per_selling_unit?: number;

  @ApiProperty({ description: 'Extended product name', required: false })
  @IsOptional()
  @IsString()
  unofficial_product_name?: string;

  @ApiProperty({ description: 'Type of finish', example: 'PVC', required: false })
  @IsOptional()
  @IsString()
  type_of_finish?: string;

  @ApiProperty({ description: 'Surface characteristics', example: 'foliowana', required: false })
  @IsOptional()
  @IsString()
  surface?: string;

  @ApiProperty({ description: 'Edge treatment', example: 'fazowanie czterostronne', required: false })
  @IsOptional()
  @IsString()
  bevel?: string;

  @ApiProperty({ description: 'Thickness in millimeters', example: 16.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  thickness_mm?: number;

  @ApiProperty({ description: 'Width in millimeters', example: 60.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  width_mm?: number;

  @ApiProperty({ description: 'Length in millimeters', example: 2400.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  length_mm?: number;

  @ApiProperty({ description: 'Package area in square meters', example: 1.873, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  package_m2?: number;

  @ApiProperty({ description: 'Additional product description', required: false })
  @IsOptional()
  @IsString()
  additional_item_description?: string;

  @ApiProperty({ description: 'Retail price per unit in PLN', example: 28.75, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  retail_price_per_unit?: number;

  @ApiProperty({ description: 'Selling price per unit in PLN', example: 23.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  selling_price_per_unit?: number;

  @ApiProperty({ description: 'Purchase price per unit in PLN', example: 14.26, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  purchase_price_per_unit?: number;

  @ApiProperty({ description: 'Potential profit in PLN', example: 8.74, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  potential_profit?: number;

  @ApiProperty({ description: 'Installation allowance percentage', example: 0.0, default: 0.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseFloat(value))
  installation_allowance?: number;

  @ApiProperty({ description: 'Currency code', example: 'PLN', default: 'PLN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Product status', enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ description: 'Whether product is active', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ description: 'Original scraped data in JSON format', required: false })
  @IsOptional()
  original_scraped_data?: Record<string, any>;
}