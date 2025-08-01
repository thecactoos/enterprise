import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';
import { IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  // Additional fields that can be updated but not created initially
  
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  totalPurchases?: number;

  @IsOptional()
  @IsDateString()
  lastPurchaseDate?: string;

  @IsOptional()
  @IsDateString()
  clientSince?: string;

  @IsOptional()
  @IsDateString()
  convertedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  contactAttempts?: number;
}