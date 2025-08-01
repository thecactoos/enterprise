import { IsNotEmpty, IsUUID, IsOptional, IsArray, ValidateNested, IsNumber, IsString, IsBoolean, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Contact ID (Lead or Client)' })
  contactId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ description: 'Quote validity date' })
  validUntil?: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Customer notes' })
  notes?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Internal notes (not visible to customer)' })
  internalNotes?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Terms and conditions' })
  termsAndConditions?: string;

  // Delivery & Payment
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Delivery method' })
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Delivery address' })
  deliveryAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Delivery cost' })
  deliveryCost?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Payment terms', default: 'Przelew 14 dni' })
  paymentTerms?: string;

  // Discount
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Discount percentage' })
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Discount amount' })
  discountAmount?: number;

  // Metadata
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Project area in m²' })
  projectArea?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Installation included', default: false })
  installationIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Measurement included', default: false })
  measurementIncluded?: boolean;

  // Items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  @ApiProperty({ 
    description: 'Quote items', 
    type: [CreateQuoteItemDto] 
  })
  items: CreateQuoteItemDto[];

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedUserId?: string;
}