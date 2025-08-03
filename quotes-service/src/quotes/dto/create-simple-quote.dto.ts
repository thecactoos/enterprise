import { IsNotEmpty, IsUUID, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimpleQuoteDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @ApiProperty({ 
    description: 'Project area in square meters',
    example: 25.5,
    minimum: 0.01
  })
  area: number;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Product ID from products service',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Client ID from contacts service',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  client_id: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ 
    description: 'Whether to include installation services',
    example: true
  })
  with_installation: boolean;
}

export interface QuoteItemResponse {
  name: string;
  unit: 'm²' | 'mb' | 'szt.';
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SimpleQuoteResponse {
  id: string;
  client_id: string;
  product_id: string;
  area: number;
  with_installation: boolean;
  created_by_user_id: string;
  created_at: Date;
  items: QuoteItemResponse[];
}