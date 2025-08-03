import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceType, PaymentMethod } from '../invoice.entity';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Type of invoice to create',
    enum: InvoiceType,
    example: InvoiceType.VAT_INVOICE,
    default: InvoiceType.VAT_INVOICE
  })
  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType = InvoiceType.VAT_INVOICE;

  @ApiProperty({
    description: 'Contact ID from contacts service',
    example: '660e8400-e29b-42d4-a716-446655440001'
  })
  @IsString()
  contactId: string;

  @ApiProperty({
    description: 'Customer NIP (Polish tax number)',
    example: '1234567890',
    required: false
  })
  @IsOptional()
  @IsString()
  customerNIP?: string;

  @ApiProperty({
    description: 'Customer REGON (Polish business number)',
    example: '123456789',
    required: false
  })
  @IsOptional()
  @IsString()
  customerREGON?: string;

  @ApiProperty({
    description: 'Whether customer is VAT payer',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  customerVATPayer?: boolean = true;

  @ApiProperty({
    description: 'Customer name/company name',
    example: 'ABC Construction Sp. z o.o.'
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Customer address',
    example: 'ul. Budowlana 123, 00-001 Warsaw, Poland',
    required: false
  })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({
    description: 'Invoice issue date (YYYY-MM-DD)',
    example: '2025-01-15',
    required: false
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || new Date().toISOString().split('T')[0])
  issueDate?: string;

  @ApiProperty({
    description: 'Sale date (data sprzedaży) (YYYY-MM-DD)',
    example: '2025-01-15',
    required: false
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || new Date().toISOString().split('T')[0])
  saleDate?: string;

  @ApiProperty({
    description: 'Payment due date (YYYY-MM-DD)',
    example: '2025-02-14',
    required: false
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (value) return value;
    // Default to 30 days from issue date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  })
  dueDate?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    default: PaymentMethod.BANK_TRANSFER
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.BANK_TRANSFER;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Installation completed as agreed',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Payment terms',
    example: 'Payment due within 30 days of invoice date',
    required: false
  })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({
    description: 'Quote ID if invoice was created from quote',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({
    description: 'User ID who is creating the invoice',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: 'Invoice items (services and products)',
    type: [CreateInvoiceItemDto],
    example: [
      {
        itemType: 'service',
        serviceId: '123e4567-e89b-12d3-a456-426614174002',
        description: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie',
        quantity: 25.5,
        unit: 'm²',
        unitPriceNet: 45.50,
        vatRate: 23.00,
        pricingTier: 'standard',
        regionalZone: 'warsaw'
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one invoice item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  // Optional fields for bulk invoice creation
  @ApiProperty({
    description: 'Auto-generate invoice number (default: true)',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  autoGenerateNumber?: boolean = true;

  @ApiProperty({
    description: 'Auto-calculate totals from items (default: true)',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  autoCalculateTotals?: boolean = true;

  @ApiProperty({
    description: 'Validate customer data against external services (default: true)',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  validateCustomer?: boolean = true;
}

// DTO for creating invoice from quote
export class CreateInvoiceFromQuoteDto {
  @ApiProperty({
    description: 'Quote ID to create invoice from',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  quoteId: string;

  @ApiProperty({
    description: 'Type of invoice to create',
    enum: InvoiceType,
    example: InvoiceType.VAT_INVOICE,
    default: InvoiceType.VAT_INVOICE
  })
  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType = InvoiceType.VAT_INVOICE;

  @ApiProperty({
    description: 'Override payment method from quote',
    enum: PaymentMethod,
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Override due date (YYYY-MM-DD)',
    example: '2025-02-14',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Additional notes for the invoice',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'User ID who is creating the invoice',
    required: false
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

// DTO for bulk invoice creation
export class BulkCreateInvoiceDto {
  @ApiProperty({
    description: 'Multiple invoices to create',
    type: [CreateInvoiceDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one invoice is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  invoices: CreateInvoiceDto[];

  @ApiProperty({
    description: 'Continue processing if some invoices fail (default: false)',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean = false;
}