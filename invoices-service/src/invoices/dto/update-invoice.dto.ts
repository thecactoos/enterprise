import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceDto } from './create-invoice.dto';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '../invoice.entity';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Payment received date (ISO string)',
    example: '2025-01-20T10:30:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiProperty({
    description: 'Manual total net override (use with caution)',
    example: 1000.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalNet?: number;

  @ApiProperty({
    description: 'Manual total VAT override (use with caution)',
    example: 230.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalVAT?: number;

  @ApiProperty({
    description: 'Manual total gross override (use with caution)',
    example: 1230.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalGross?: number;
}

// DTO for payment operations
export class PaymentDto {
  @ApiProperty({
    description: 'Payment date (ISO string)',
    example: '2025-01-20T10:30:00Z'
  })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Amount paid (for partial payments)',
    example: 1230.00,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountPaid?: number;

  @ApiProperty({
    description: 'Payment reference/transaction ID',
    example: 'TXN123456789',
    required: false
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiProperty({
    description: 'Payment notes',
    example: 'Payment received via bank transfer',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO for cancelling invoice
export class CancelInvoiceDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Customer requested cancellation due to project changes'
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Create corrective invoice',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  createCorrective?: boolean = false;

  @ApiProperty({
    description: 'Cancellation date (ISO string)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  cancellationDate?: string;
}

// DTO for sending invoice
export class SendInvoiceDto {
  @ApiProperty({
    description: 'Email address to send invoice to',
    example: 'customer@example.com',
    required: false
  })
  @IsOptional()
  @IsString()
  emailTo?: string;

  @ApiProperty({
    description: 'Email subject override',
    example: 'Faktura VAT FV/2025/01/0001',
    required: false
  })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiProperty({
    description: 'Email message body',
    example: 'Szanowni Państwo, przesyłamy fakturę VAT...',
    required: false
  })
  @IsOptional()
  @IsString()
  emailMessage?: string;

  @ApiProperty({
    description: 'Send copy to sender',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  sendCopy?: boolean = false;

  @ApiProperty({
    description: 'Include payment instructions',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includePaymentInstructions?: boolean = true;
}

// DTO for invoice queries
export class InvoiceQueryDto {
  @ApiProperty({
    description: 'Search term (invoice number, customer name)',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by invoice status',
    enum: InvoiceStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Filter by contact ID',
    required: false
  })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiProperty({
    description: 'Filter from date (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filter to date (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    description: 'Minimum amount filter',
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiProperty({
    description: 'Maximum amount filter',
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiProperty({
    description: 'Show only overdue invoices',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean = false;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    default: 20,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Sort by field',
    example: 'issueDate',
    default: 'createdAt',
    required: false
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort direction',
    example: 'DESC',
    default: 'DESC',
    required: false
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}