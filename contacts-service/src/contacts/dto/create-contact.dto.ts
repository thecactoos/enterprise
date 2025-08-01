import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max, Length, IsPhoneNumber, IsBoolean, IsUUID, IsDateString } from 'class-validator';
import { ContactType, ContactSource, ContactStatus, ContactPriority, BusinessType, ProjectType } from '../contact.entity';
import { Transform } from 'class-transformer';

export class CreateContactDto {
  // ========================================
  // REQUIRED FIELDS
  // ========================================

  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  @IsEmail()
  email: string;

  // ========================================
  // OPTIONAL CONTACT TYPE
  // ========================================

  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType = ContactType.LEAD;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  @IsOptional()
  @IsPhoneNumber('PL')
  phone?: string;

  // ========================================
  // COMPANY/BUSINESS INFORMATION
  // ========================================

  @IsOptional()
  @Length(1, 200)
  company?: string;

  @IsOptional()
  @Length(1, 100)
  position?: string;

  @IsOptional()
  @Length(1, 20)
  nip?: string;

  @IsOptional()
  @Length(1, 20)
  regon?: string;

  @IsOptional()
  @Length(1, 20)
  krs?: string;

  @IsOptional()
  @Length(1, 500)
  website?: string;

  @IsOptional()
  @Length(1, 200)
  industry?: string;

  @IsOptional()
  @Length(1, 100)
  companySize?: string;

  // ========================================
  // CLASSIFICATION
  // ========================================

  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource = ContactSource.OTHER;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus = ContactStatus.NEW;

  @IsOptional()
  @IsEnum(ContactPriority)
  priority?: ContactPriority = ContactPriority.MEDIUM;

  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType = BusinessType.B2C;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @Length(1, 2000)
  projectDescription?: string;

  @IsOptional()
  @Length(1, 200)
  timeline?: string;

  // ========================================
  // FINANCIAL INFORMATION
  // ========================================

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  estimatedValue?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  estimatedBudget?: number;

  @IsOptional()
  @Length(1, 3)
  currency?: string = 'PLN';

  // ========================================
  // GEOGRAPHICAL INFORMATION
  // ========================================

  @IsOptional()
  @Length(1, 200)
  address?: string;

  @IsOptional()
  @Length(1, 200)
  street?: string;

  @IsOptional()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @Length(1, 20)
  postalCode?: string;

  @IsOptional()
  @Length(1, 100)
  voivodeship?: string;

  @IsOptional()
  @Length(1, 100)
  country?: string = 'Poland';

  // ========================================
  // TRACKING & ANALYTICS
  // ========================================

  @IsOptional()
  @Length(1, 200)
  sourceDetails?: string;

  @IsOptional()
  requirements?: string[];

  @IsOptional()
  notes?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  qualificationScore?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value))
  interestLevel?: number;

  // ========================================
  // DATES
  // ========================================

  @IsOptional()
  @IsDateString()
  firstContactDate?: string;

  @IsOptional()
  @IsDateString()
  lastContactDate?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  // ========================================
  // METADATA
  // ========================================

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean()
  gdprConsent?: boolean = false;

  @IsOptional()
  @IsDateString()
  gdprConsentDate?: string;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean = false;

  @IsOptional()
  customFields?: Record<string, any>;
}