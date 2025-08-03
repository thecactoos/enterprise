# Invoice Service Creation - Handoff Instructions

## Handoff to Rapid-Prototyper Agent

**Task**: Create a new Invoice Service (Port 3008) for the Polish Construction CRM with full integration to enhanced Services and Products pricing systems.

## Phase 4 Backend Enhancement Status ✅

### Completed Enhancements
1. **Services Service**: Advanced pricing tiers, VAT integration, bulk operations (already implemented)
2. **Products Service**: Enhanced with margin management, supplier pricing, bulk updates
3. **Database**: Polish compliance schema, price history tracking, performance optimization
4. **Polish Compliance**: VAT calculations, PLN formatting, NIP/REGON validation, regional pricing

### Integration Points Ready
- **Services**: Advanced pricing calculations with tiers and regional multipliers
- **Products**: Margin management with supplier cost tracking
- **Contacts**: Polish business validation (NIP, REGON, VAT payer status)
- **API Gateway**: Routing configuration and authentication
- **Database**: Invoice sequences, price history, Polish compliance fields

## Invoice Service Specifications (Port 3008)

### Core Requirements

#### 1. Entity Structure
```typescript
// Invoice Entity (invoice.entity.ts)
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  // Polish Invoice Standards
  @Column({ unique: true })
  invoiceNumber: string; // FV/YYYY/MM/NNNN format
  
  @Column({ type: 'enum', enum: InvoiceType })
  invoiceType: InvoiceType; // VAT_INVOICE | PROFORMA | CORRECTIVE
  
  @Column({ type: 'enum', enum: InvoiceStatus })
  status: InvoiceStatus; // DRAFT | SENT | PAID | OVERDUE | CANCELLED
  
  // Customer Information
  @Column('uuid')
  contactId: string;
  
  @ManyToOne(() => Contact)
  contact: Contact;
  
  // Polish Business Fields
  @Column({ nullable: true })
  customerNIP: string;
  
  @Column({ nullable: true })
  customerREGON: string;
  
  @Column({ default: true })
  customerVATPayer: boolean;
  
  // Dates (Polish Requirements)
  @Column({ type: 'date' })
  issueDate: Date;
  
  @Column({ type: 'date' })
  saleDate: Date; // Data sprzedaży
  
  @Column({ type: 'date' })
  dueDate: Date;
  
  // Financial Summary
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalNet: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalVAT: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalGross: number;
  
  @Column({ default: 'PLN' })
  currency: string;
  
  // Payment Information
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;
  
  @Column({ type: 'enum', enum: PaymentStatus })
  paymentStatus: PaymentStatus;
  
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
  
  // Additional Fields
  @Column({ type: 'text', nullable: true })
  notes: string;
  
  @Column({ type: 'text', nullable: true })
  paymentTerms: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}

// Invoice Item Entity (invoice-item.entity.ts)
@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('uuid')
  invoiceId: string;
  
  @ManyToOne(() => Invoice, invoice => invoice.items)
  invoice: Invoice;
  
  // Item Reference (Service or Product)
  @Column({ type: 'enum', enum: ItemType })
  itemType: ItemType; // SERVICE | PRODUCT
  
  @Column('uuid', { nullable: true })
  serviceId: string;
  
  @Column('uuid', { nullable: true })
  productId: string;
  
  // Item Details
  @Column()
  description: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;
  
  @Column()
  unit: string; // m², szt, godz, dzień
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPriceNet: number;
  
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  vatRate: number;
  
  // Calculated Fields
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalNet: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalVAT: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalGross: number;
  
  // Pricing Context
  @Column({ nullable: true })
  pricingTier: string; // basic|standard|premium
  
  @Column({ nullable: true })
  regionalZone: string; // warsaw|krakow|other
  
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;
}

// Enums
export enum InvoiceType {
  VAT_INVOICE = 'vat_invoice',
  PROFORMA = 'proforma', 
  CORRECTIVE = 'corrective'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CARD = 'card',
  BLIK = 'blik'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export enum ItemType {
  SERVICE = 'service',
  PRODUCT = 'product'
}
```

#### 2. Service Methods
```typescript
// invoices.service.ts - Core Methods
export class InvoicesService {
  // CRUD Operations
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice>
  async findAll(query: InvoiceQueryDto): Promise<PaginatedResult<Invoice>>
  async findOne(id: string): Promise<Invoice>
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice>
  async remove(id: string): Promise<void>
  
  // Polish Business Logic
  async generateInvoiceNumber(invoiceType: InvoiceType): Promise<string>
  async validateCustomerData(contactId: string): Promise<ValidationResult>
  async calculateInvoiceTotals(items: InvoiceItem[]): Promise<InvoiceTotals>
  async applyPolishVATRules(items: InvoiceItem[]): Promise<VATSummary>
  
  // Integration with Services/Products
  async addServiceToInvoice(invoiceId: string, serviceId: string, quantity: number, pricingOptions: PricingOptions): Promise<InvoiceItem>
  async addProductToInvoice(invoiceId: string, productId: string, quantity: number): Promise<InvoiceItem>
  async recalculateInvoice(invoiceId: string): Promise<Invoice>
  
  // Status Management
  async sendInvoice(invoiceId: string): Promise<Invoice>
  async markAsPaid(invoiceId: string, paymentDate: Date, paymentMethod: PaymentMethod): Promise<Invoice>
  async cancelInvoice(invoiceId: string, reason: string): Promise<Invoice>
  
  // Analytics & Reporting
  async getInvoiceStatistics(dateRange?: DateRange): Promise<InvoiceStatistics>
  async getOverdueInvoices(): Promise<Invoice[]>
  async getVATReport(period: Period): Promise<VATReport>
  async getCustomerInvoices(contactId: string): Promise<Invoice[]>
  
  // PDF Generation
  async generateInvoicePDF(invoiceId: string): Promise<Buffer>
  async generateProformaPDF(invoiceId: string): Promise<Buffer>
}
```

#### 3. Controller Endpoints
```typescript
// invoices.controller.ts - Essential Endpoints
@Controller('invoices')
export class InvoicesController {
  // Basic CRUD
  @Post() create(@Body() createInvoiceDto: CreateInvoiceDto)
  @Get() findAll(@Query() query: InvoiceQueryDto)
  @Get(':id') findOne(@Param('id') id: string)
  @Patch(':id') update(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto)
  @Delete(':id') remove(@Param('id') id: string)
  
  // Polish Business Operations
  @Post('generate-number/:type') generateNumber(@Param('type') type: InvoiceType)
  @Post(':id/validate-customer') validateCustomer(@Param('id') id: string)
  @Post(':id/calculate-totals') calculateTotals(@Param('id') id: string)
  
  // Item Management
  @Post(':id/items/service') addService(@Param('id') id: string, @Body() serviceDto: AddServiceDto)
  @Post(':id/items/product') addProduct(@Param('id') id: string, @Body() productDto: AddProductDto)
  @Delete(':id/items/:itemId') removeItem(@Param('id') id: string, @Param('itemId') itemId: string)
  @Post(':id/recalculate') recalculate(@Param('id') id: string)
  
  // Status Management
  @Patch(':id/send') sendInvoice(@Param('id') id: string)
  @Patch(':id/mark-paid') markPaid(@Param('id') id: string, @Body() paymentDto: PaymentDto)
  @Patch(':id/cancel') cancel(@Param('id') id: string, @Body() cancelDto: CancelDto)
  
  // Analytics
  @Get('analytics/statistics') getStatistics(@Query() dateRange?: DateRangeDto)
  @Get('analytics/overdue') getOverdue()
  @Get('analytics/vat-report') getVATReport(@Query() period: PeriodDto)
  @Get('customer/:contactId') getCustomerInvoices(@Param('contactId') contactId: string)
  
  // PDF Generation
  @Get(':id/pdf') generatePDF(@Param('id') id: string, @Res() res: Response)
  @Get(':id/proforma-pdf') generateProformaPDF(@Param('id') id: string, @Res() res: Response)
}
```

### Integration Requirements

#### 1. Services Integration
```typescript
// Integration with enhanced Services Service
interface ServicePricingOptions {
  tier: PricingTier; // basic|standard|premium
  regionalZone: RegionalZone; // warsaw|krakow|other
  applySeasonalAdjustment?: boolean;
  customDiscountPercent?: number;
}

// Method to add service to invoice with advanced pricing
async addServiceToInvoice(
  invoiceId: string, 
  serviceId: string, 
  quantity: number, 
  options: ServicePricingOptions
): Promise<InvoiceItem> {
  // 1. Get service from Services Service
  const service = await this.servicesService.findOne(serviceId);
  
  // 2. Calculate advanced pricing
  const pricingCalculation = await this.servicesService.calculateAdvancedPricing(serviceId, {
    quantity,
    tier: options.tier,
    regionalZone: options.regionalZone,
    applySeasonalAdjustment: options.applySeasonalAdjustment
  });
  
  // 3. Create invoice item with calculated pricing
  const invoiceItem = this.createInvoiceItem({
    description: service.serviceName,
    quantity,
    unit: this.getPricingUnit(service.pricingModel),
    unitPriceNet: pricingCalculation.effectiveRate,
    vatRate: service.vatRate,
    totalNet: pricingCalculation.netPrice,
    totalVAT: pricingCalculation.vatAmount,
    totalGross: pricingCalculation.grossPrice,
    discountAmount: pricingCalculation.discountApplied,
    pricingTier: options.tier,
    regionalZone: options.regionalZone
  });
  
  return invoiceItem;
}
```

#### 2. Products Integration
```typescript
// Integration with enhanced Products Service
async addProductToInvoice(
  invoiceId: string, 
  productId: string, 
  quantity: number,
  useOptimalPricing?: boolean
): Promise<InvoiceItem> {
  // 1. Get product from Products Service
  const product = await this.productsService.findOne(productId);
  
  // 2. Use optimal pricing if requested
  let unitPrice = product.selling_price_per_unit;
  if (useOptimalPricing) {
    const optimalPricing = await this.productsService.calculateOptimalPricing(productId, {
      targetMargin: product.target_margin_percent || 25
    });
    unitPrice = optimalPricing.recommendedPrice;
  }
  
  // 3. Calculate totals with VAT
  const totalNet = unitPrice * quantity;
  const vatAmount = (totalNet * product.vat_rate) / 100;
  const totalGross = totalNet + vatAmount;
  
  // 4. Create invoice item
  const invoiceItem = this.createInvoiceItem({
    description: product.product_name,
    quantity,
    unit: this.convertSellingUnit(product.selling_unit),
    unitPriceNet: unitPrice,
    vatRate: product.vat_rate,
    totalNet,
    totalVAT: vatAmount,
    totalGross
  });
  
  return invoiceItem;
}
```

#### 3. Polish Compliance Integration
```typescript
// Polish compliance methods
async validateCustomerData(contactId: string): Promise<ValidationResult> {
  const contact = await this.contactsService.findOne(contactId);
  
  const validation = this.polishComplianceService.validateBusinessData({
    nip: contact.nip,
    regon: contact.regon,
    postalCode: contact.postal_code,
    voivodeship: contact.voivodeship
  });
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    customerInfo: {
      name: contact.company_name || `${contact.first_name} ${contact.last_name}`,
      nip: validation.errors.length === 0 ? contact.nip : null,
      vatPayer: contact.vat_payer || false
    }
  };
}

async applyPolishVATRules(items: InvoiceItem[]): Promise<VATSummary> {
  return this.polishInvoiceVATCalculator.calculateVATSummary(
    items.map(item => ({
      netAmount: item.totalNet,
      vatRate: item.vatRate
    }))
  );
}

async generateInvoiceNumber(invoiceType: InvoiceType): Promise<string> {
  const sequence = await this.getNextSequenceNumber(invoiceType);
  
  switch (invoiceType) {
    case InvoiceType.VAT_INVOICE:
      return this.polishInvoiceNumberGenerator.generateInvoiceNumber(sequence);
    case InvoiceType.PROFORMA:
      return this.polishInvoiceNumberGenerator.generateQuoteNumber(sequence);
    default:
      return `${invoiceType.toUpperCase()}/${new Date().getFullYear()}/${sequence}`;
  }
}
```

### Database Migration

```sql
-- Migration 005: Create Invoice Tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoice Types and Statuses
CREATE TYPE invoice_type_enum AS ENUM ('vat_invoice', 'proforma', 'corrective');
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'cash', 'card', 'blik');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE item_type_enum AS ENUM ('service', 'product');

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type invoice_type_enum NOT NULL DEFAULT 'vat_invoice',
    status invoice_status_enum NOT NULL DEFAULT 'draft',
    
    -- Customer
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    customer_nip VARCHAR(15),
    customer_regon VARCHAR(20),
    customer_vat_payer BOOLEAN DEFAULT TRUE,
    
    -- Dates
    issue_date DATE NOT NULL,
    sale_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Financial
    total_net DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_gross DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Payment
    payment_method payment_method_enum DEFAULT 'bank_transfer',
    payment_status payment_status_enum DEFAULT 'pending',
    paid_at TIMESTAMP,
    
    -- Additional
    notes TEXT,
    payment_terms TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item reference
    item_type item_type_enum NOT NULL,
    service_id UUID REFERENCES services(id),
    product_id UUID REFERENCES products(id),
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price_net DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    
    -- Totals
    total_net DECIMAL(10,2) NOT NULL,
    total_vat DECIMAL(10,2) NOT NULL,
    total_gross DECIMAL(10,2) NOT NULL,
    
    -- Pricing context
    pricing_tier VARCHAR(20),
    regional_zone VARCHAR(20),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_service ON invoice_items(service_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- Sequences for invoice numbering
CREATE SEQUENCE invoice_number_sequence START 1;
CREATE SEQUENCE proforma_number_sequence START 1;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### API Gateway Integration

```typescript
// Add to api-gateway/src/app.module.ts
const INVOICES_SERVICE_URL = process.env.INVOICES_SERVICE_URL || 'http://invoices-service:3008';

// Proxy configuration
{
  path: '/invoices',
  url: INVOICES_SERVICE_URL,
}
```

### Docker Configuration

```yaml
# Add to docker-compose.yml
invoices-service:
  build:
    context: ./invoices-service
    dockerfile: Dockerfile
  container_name: invoices-service
  ports:
    - "3008:3008"
  environment:
    - NODE_ENV=development
    - DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db
    - REDIS_URL=redis://redis:6379
    - JWT_SECRET=your-super-secret-jwt-key
    - SERVICES_SERVICE_URL=http://services-service:3007
    - PRODUCTS_SERVICE_URL=http://products-service:3004
    - CONTACTS_SERVICE_URL=http://contacts-service:3005
  depends_on:
    - postgres
    - redis
    - services-service
    - products-service
    - contacts-service
  networks:
    - crm-network
  volumes:
    - ./invoices-service:/app
    - /app/node_modules
```

### Key Implementation Notes

#### 1. Polish Standards Compliance
- **Invoice numbering**: FV/YYYY/MM/NNNN format required
- **VAT rates**: 0%, 8%, 23% with proper business logic
- **Currency formatting**: Polish PLN format (1 234,56 PLN)
- **Business validation**: NIP/REGON integration
- **Date requirements**: Issue date, sale date, due date

#### 2. Service Integration Points
- **Services Service**: Use advanced pricing calculations
- **Products Service**: Use margin-optimized pricing
- **Contacts Service**: Polish business validation
- **Polish Compliance Service**: VAT, formatting, validation

#### 3. Performance Requirements
- **PDF generation**: <2 seconds for invoice PDFs
- **Bulk operations**: Support for multiple invoice items
- **Real-time calculations**: Instant totals recalculation
- **Database optimization**: Proper indexing for queries

#### 4. Security & Authentication
- **JWT authentication**: Required for all operations
- **Role-based access**: Admin/user permissions
- **Data validation**: Comprehensive input validation
- **Audit trail**: Track all invoice modifications

## Success Criteria

### Functional Requirements ✅
- Create VAT-compliant Polish invoices
- Integrate with enhanced Services/Products pricing
- Generate professional PDF invoices
- Support proforma and corrective invoices
- Real-time pricing calculations

### Technical Requirements ✅
- NestJS microservice on port 3008
- PostgreSQL integration with proper schema
- Docker containerization
- API Gateway integration
- Comprehensive error handling

### Polish Compliance ✅
- Correct VAT calculations and reporting
- Polish invoice number format (FV/YYYY/MM/NNNN)
- PLN currency formatting (1 234,56 PLN)
- NIP/REGON business validation
- Invoice date requirements (issue, sale, due dates)

## Rapid-Prototyper Instructions

1. **Create NestJS service structure** using existing service patterns
2. **Implement entities** with Polish compliance fields
3. **Create service methods** with Services/Products integration
4. **Build controller endpoints** following API specification
5. **Set up database migration** with proper indexes
6. **Configure Docker** and API Gateway integration
7. **Add Polish compliance validation** throughout
8. **Implement PDF generation** using existing patterns
9. **Create comprehensive testing** for all functionality
10. **Document API endpoints** with Swagger integration

The enhanced Services and Products services provide the foundation for advanced pricing calculations. Focus on seamless integration and Polish business compliance to deliver a production-ready Invoice Service.