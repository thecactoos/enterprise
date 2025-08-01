import { IsOptional, IsEnum, IsNumber, Min, Max, IsString, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContactType, ContactSource, ContactStatus, ContactPriority, BusinessType, ProjectType } from '../contact.entity';

export class ContactQueryDto {
  // ========================================
  // PAGINATION
  // ========================================

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  // ========================================
  // BASIC FILTERS
  // ========================================

  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactPriority)
  priority?: ContactPriority;

  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  // ========================================
  // SEARCH
  // ========================================

  @IsOptional()
  @IsString()
  search?: string; // Search in name, email, company, phone

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  voivodeship?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  // ========================================
  // NUMERIC FILTERS
  // ========================================

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  minQualificationScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  maxQualificationScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minEstimatedValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxEstimatedValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minTotalPurchases?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxTotalPurchases?: number;

  // ========================================
  // DATE FILTERS
  // ========================================

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsDateString()
  lastContactAfter?: string;

  @IsOptional()
  @IsDateString()
  lastContactBefore?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAfter?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpBefore?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseAfter?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseBefore?: string;

  // ========================================
  // RELATIONSHIP FILTERS
  // ========================================

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unassigned?: boolean; // Filter for contacts without assigned user

  // ========================================
  // STATUS FLAGS
  // ========================================

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  needsFollowUp?: boolean; // Computed filter

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isOverdue?: boolean; // Computed filter

  // ========================================
  // SORTING
  // ========================================

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'; // Default sort by creation date

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC'; // Default newest first

  // ========================================
  // ADDITIONAL FILTERS
  // ========================================

  @IsOptional()
  @IsString()
  tags?: string; // Comma-separated list of tags

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withGdprConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withMarketingConsent?: boolean;
}