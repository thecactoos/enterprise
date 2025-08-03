import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Invoice, InvoiceType, InvoiceStatus, PaymentStatus, PaymentMethod } from './invoice.entity';
import { InvoiceItem, ItemType } from './invoice-item.entity';
import { CreateInvoiceDto, CreateInvoiceFromQuoteDto, BulkCreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoiceItemDto, AddServiceToInvoiceDto, AddProductToInvoiceDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceDto, PaymentDto, CancelInvoiceDto, InvoiceQueryDto } from './dto/update-invoice.dto';
import { 
  PolishInvoiceNumberGenerator, 
  PolishCurrencyFormatter, 
  PolishVATCalculator,
  PolishBusinessValidator,
  InvoiceValidationResult,
  VATSummary
} from './utils/polish-invoice.utils';
import { VATCalculator, InvoiceVATSummary } from './utils/vat-calculator';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  paymentRate: number;
  overdueRate: number;
  monthlyStats: Array<{
    month: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}

export interface VATReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalNet: number;
    totalVAT: number;
    totalGross: number;
  };
  vatBreakdown: Array<{
    vatRate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    invoiceCount: number;
  }>;
  invoices: Invoice[];
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    private readonly httpService: HttpService,
  ) {}

  // External service URLs
  private readonly servicesServiceUrl = process.env.SERVICES_SERVICE_URL || 'http://services-service:3007';
  private readonly productsServiceUrl = process.env.PRODUCTS_SERVICE_URL || 'http://products-service:3004';
  private readonly contactsServiceUrl = process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005';

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create new invoice with Polish compliance
   */
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    try {
      // Validate customer data if requested
      if (createInvoiceDto.validateCustomer) {
        const validation = await this.validateCustomerData(createInvoiceDto.contactId);
        if (!validation.isValid) {
          throw new BadRequestException(`Customer validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Generate invoice number if requested
      let invoiceNumber: string;
      if (createInvoiceDto.autoGenerateNumber) {
        invoiceNumber = await this.generateInvoiceNumber(createInvoiceDto.invoiceType || InvoiceType.VAT_INVOICE);
      } else {
        // TODO: Allow manual invoice number input in future versions
        invoiceNumber = await this.generateInvoiceNumber(createInvoiceDto.invoiceType || InvoiceType.VAT_INVOICE);
      }

      // Create invoice entity
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        invoiceType: createInvoiceDto.invoiceType || InvoiceType.VAT_INVOICE,
        contactId: createInvoiceDto.contactId,
        customerNIP: createInvoiceDto.customerNIP,
        customerREGON: createInvoiceDto.customerREGON,
        customerVATPayer: createInvoiceDto.customerVATPayer ?? true,
        customerName: createInvoiceDto.customerName,
        customerAddress: createInvoiceDto.customerAddress,
        issueDate: new Date(createInvoiceDto.issueDate || new Date()),
        saleDate: new Date(createInvoiceDto.saleDate || new Date()),
        dueDate: new Date(createInvoiceDto.dueDate || this.getDefaultDueDate()),
        paymentMethod: createInvoiceDto.paymentMethod || PaymentMethod.BANK_TRANSFER,
        notes: createInvoiceDto.notes,
        paymentTerms: createInvoiceDto.paymentTerms || this.getDefaultPaymentTerms(),
        quoteId: createInvoiceDto.quoteId,
        createdBy: createInvoiceDto.createdBy,
        currency: 'PLN',
        totalNet: 0,
        totalVAT: 0,
        totalGross: 0,
      });

      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Create invoice items
      if (createInvoiceDto.items && createInvoiceDto.items.length > 0) {
        for (let i = 0; i < createInvoiceDto.items.length; i++) {
          const itemDto = createInvoiceDto.items[i];
          const invoiceItem = await this.createInvoiceItem(savedInvoice.id, itemDto, i + 1);
        }
      }

      // Recalculate totals if requested
      if (createInvoiceDto.autoCalculateTotals) {
        await this.recalculateInvoice(savedInvoice.id);
      }

      return this.findOne(savedInvoice.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Find all invoices with filtering and pagination
   */
  async findAll(query: InvoiceQueryDto): Promise<PaginatedResult<Invoice>> {
    const {
      search,
      status,
      paymentStatus,
      contactId,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      overdueOnly,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query;

    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.customerName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Status filters
    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('invoice.paymentStatus = :paymentStatus', { paymentStatus });
    }

    // Contact filter
    if (contactId) {
      queryBuilder.andWhere('invoice.contactId = :contactId', { contactId });
    }

    // Date range filter
    if (fromDate) {
      queryBuilder.andWhere('invoice.issueDate >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('invoice.issueDate <= :toDate', { toDate });
    }

    // Amount filters
    if (minAmount) {
      queryBuilder.andWhere('invoice.totalGross >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('invoice.totalGross <= :maxAmount', { maxAmount });
    }

    // Overdue filter
    if (overdueOnly) {
      queryBuilder.andWhere('invoice.dueDate < :now AND invoice.paymentStatus != :paid', {
        now: new Date(),
        paid: PaymentStatus.PAID
      });
    }

    // Sorting
    const allowedSortFields = ['invoiceNumber', 'customerName', 'issueDate', 'dueDate', 'totalGross', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`invoice.${sortField}`, sortOrder);

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [invoices, total] = await queryBuilder.getManyAndCount();

    return {
      data: invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find single invoice by ID
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items']
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Update invoice
   */
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Prevent updates to sent or paid invoices (business rule)
    if (invoice.status === InvoiceStatus.PAID && !updateInvoiceDto.paymentStatus) {
      throw new BadRequestException('Cannot modify paid invoices');
    }

    // Update fields
    Object.assign(invoice, updateInvoiceDto);

    // Handle date string conversions
    if (updateInvoiceDto.issueDate) {
      invoice.issueDate = new Date(updateInvoiceDto.issueDate);
    }
    if (updateInvoiceDto.saleDate) {
      invoice.saleDate = new Date(updateInvoiceDto.saleDate);
    }
    if (updateInvoiceDto.dueDate) {
      invoice.dueDate = new Date(updateInvoiceDto.dueDate);
    }
    if (updateInvoiceDto.paidAt) {
      invoice.paidAt = new Date(updateInvoiceDto.paidAt);
    }

    const savedInvoice = await this.invoiceRepository.save(invoice);
    return this.findOne(savedInvoice.id);
  }

  /**
   * Delete invoice
   */
  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);

    // Prevent deletion of sent or paid invoices
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Cannot delete non-draft invoices');
    }

    await this.invoiceRepository.remove(invoice);
  }

  // ==================== POLISH BUSINESS LOGIC ====================

  /**
   * Generate Polish-compliant invoice number
   */
  async generateInvoiceNumber(invoiceType: InvoiceType): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Get existing invoice numbers for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const existingInvoices = await this.invoiceRepository.find({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
        invoiceType
      },
      select: ['invoiceNumber']
    });

    const existingNumbers = existingInvoices.map(inv => inv.invoiceNumber);
    const nextSequence = PolishInvoiceNumberGenerator.getNextSequence(existingNumbers, year, month);

    return PolishInvoiceNumberGenerator.generateByType(invoiceType, nextSequence, currentDate);
  }

  /**
   * Validate customer data against contacts service
   */
  async validateCustomerData(contactId: string): Promise<InvoiceValidationResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.contactsServiceUrl}/contacts/${contactId}`)
      );

      const contact = response.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate NIP if provided
      if (contact.nip) {
        const nipValidation = PolishBusinessValidator.validateNIP(contact.nip);
        if (!nipValidation.isValid) {
          errors.push(`Invalid NIP: ${nipValidation.message}`);
        }
      }

      // Validate REGON if provided
      if (contact.regon) {
        const regonValidation = PolishBusinessValidator.validateREGON(contact.regon);
        if (!regonValidation.isValid) {
          errors.push(`Invalid REGON: ${regonValidation.message}`);
        }
      }

      // Check required fields
      if (!contact.first_name && !contact.last_name && !contact.company_name) {
        errors.push('Customer must have either personal name or company name');
      }

      // Warnings for missing optional fields
      if (!contact.postal_code) {
        warnings.push('Postal code not provided');
      }

      if (!contact.phone && !contact.email) {
        warnings.push('No contact information (phone or email) provided');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        customerInfo: {
          name: contact.company_name || `${contact.first_name} ${contact.last_name}`,
          nip: contact.nip,
          regon: contact.regon,
          vatPayer: contact.vat_payer || false,
          address: this.formatCustomerAddress(contact)
        }
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate customer: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Calculate invoice totals from items
   */
  async calculateInvoiceTotals(invoiceId: string): Promise<{ 
    totalNet: number; 
    totalVAT: number; 
    totalGross: number;
    vatSummary: InvoiceVATSummary;
  }> {
    const invoice = await this.findOne(invoiceId);
    
    if (!invoice.items || invoice.items.length === 0) {
      return {
        totalNet: 0,
        totalVAT: 0,
        totalGross: 0,
        vatSummary: {
          totalNet: 0,
          totalVAT: 0,
          totalGross: 0,
          vatBreakdown: [],
          hasMultipleRates: false
        }
      };
    }

    const vatSummary = VATCalculator.calculateInvoiceVATSummary(
      invoice.items.map(item => ({
        netAmount: item.totalNet,
        vatRate: item.vatRate
      }))
    );

    return {
      totalNet: vatSummary.totalNet,
      totalVAT: vatSummary.totalVAT,
      totalGross: vatSummary.totalGross,
      vatSummary
    };
  }

  /**
   * Apply Polish VAT rules and calculations
   */
  async applyPolishVATRules(invoiceId: string): Promise<VATSummary> {
    const invoice = await this.findOne(invoiceId);
    
    const items = invoice.items.map(item => ({
      netAmount: item.totalNet,
      vatRate: item.vatRate
    }));

    return PolishVATCalculator.calculateVATSummary(items);
  }

  // ==================== INVOICE ITEM MANAGEMENT ====================

  /**
   * Add service to invoice with enhanced pricing
   */
  async addServiceToInvoice(
    invoiceId: string, 
    serviceDto: AddServiceToInvoiceDto
  ): Promise<InvoiceItem> {
    try {
      // Get service from Services Service
      const serviceResponse = await firstValueFrom(
        this.httpService.get(`${this.servicesServiceUrl}/services/${serviceDto.serviceId}`)
      );
      const service = serviceResponse.data;

      // Calculate advanced pricing
      const pricingRequest = {
        quantity: serviceDto.quantity,
        tier: serviceDto.pricingTier || 'standard',
        regionalZone: serviceDto.regionalZone || 'other',
        applySeasonalAdjustment: serviceDto.applySeasonalAdjustment || false
      };

      const pricingResponse = await firstValueFrom(
        this.httpService.post(
          `${this.servicesServiceUrl}/services/${serviceDto.serviceId}/calculate`,
          pricingRequest
        )
      );
      const pricingResult = pricingResponse.data;

      // Create invoice item
      const itemDto: CreateInvoiceItemDto = {
        itemType: ItemType.SERVICE,
        serviceId: serviceDto.serviceId,
        description: service.serviceName,
        quantity: serviceDto.quantity,
        unit: this.getPricingUnit(service.pricingModel),
        unitPriceNet: pricingResult.effectiveRate || service.basePricePerM2,
        vatRate: service.vatRate,
        pricingTier: serviceDto.pricingTier,
        regionalZone: serviceDto.regionalZone,
        discountAmount: pricingResult.discountApplied || 0,
        discountPercent: serviceDto.customDiscountPercent || 0,
        lineNumber: serviceDto.lineNumber
      };

      return this.createInvoiceItem(invoiceId, itemDto);
    } catch (error) {
      throw new BadRequestException(`Failed to add service to invoice: ${error.message}`);
    }
  }

  /**
   * Add product to invoice with optimal pricing
   */
  async addProductToInvoice(
    invoiceId: string,
    productDto: AddProductToInvoiceDto
  ): Promise<InvoiceItem> {
    try {
      // Get product from Products Service
      const productResponse = await firstValueFrom(
        this.httpService.get(`${this.productsServiceUrl}/products/${productDto.productId}`)
      );
      const product = productResponse.data;

      // Use optimal pricing if requested
      let unitPrice = product.selling_price_per_unit;
      if (productDto.useOptimalPricing) {
        try {
          const optimalResponse = await firstValueFrom(
            this.httpService.post(
              `${this.productsServiceUrl}/products/${productDto.productId}/calculate-optimal-pricing`,
              { targetMargin: product.target_margin_percent || 25 }
            )
          );
          unitPrice = optimalResponse.data.recommendedPrice;
        } catch (error) {
          // Fallback to standard price if optimal pricing fails
          console.warn('Failed to calculate optimal pricing, using standard price:', error.message);
        }
      }

      // Create invoice item
      const itemDto: CreateInvoiceItemDto = {
        itemType: ItemType.PRODUCT,
        productId: productDto.productId,
        description: product.product_name,
        quantity: productDto.quantity,
        unit: this.convertSellingUnit(product.selling_unit),
        unitPriceNet: unitPrice,
        vatRate: product.vat_rate || 23,
        discountPercent: productDto.discountPercent || 0,
        lineNumber: productDto.lineNumber
      };

      return this.createInvoiceItem(invoiceId, itemDto);
    } catch (error) {
      throw new BadRequestException(`Failed to add product to invoice: ${error.message}`);
    }
  }

  /**
   * Create invoice item
   */
  private async createInvoiceItem(
    invoiceId: string,
    itemDto: CreateInvoiceItemDto,
    lineNumber?: number
  ): Promise<InvoiceItem> {
    const invoiceItem = this.invoiceItemRepository.create({
      invoiceId,
      itemType: itemDto.itemType,
      serviceId: itemDto.serviceId,
      productId: itemDto.productId,
      description: itemDto.description,
      quantity: itemDto.quantity,
      unit: itemDto.unit,
      unitPriceNet: itemDto.unitPriceNet,
      vatRate: itemDto.vatRate,
      pricingTier: itemDto.pricingTier,
      regionalZone: itemDto.regionalZone,
      discountPercent: itemDto.discountPercent || 0,
      discountAmount: itemDto.discountAmount || 0,
      lineNumber: lineNumber || itemDto.lineNumber || 1,
      totalNet: 0,
      totalVAT: 0,
      totalGross: 0
    });

    // Calculate totals
    invoiceItem.calculateTotals();

    return this.invoiceItemRepository.save(invoiceItem);
  }

  /**
   * Remove item from invoice
   */
  async removeItemFromInvoice(invoiceId: string, itemId: string): Promise<void> {
    const invoice = await this.findOne(invoiceId);
    const item = await this.invoiceItemRepository.findOne({
      where: { id: itemId, invoiceId }
    });

    if (!item) {
      throw new NotFoundException(`Invoice item with ID ${itemId} not found`);
    }

    await this.invoiceItemRepository.remove(item);
    await this.recalculateInvoice(invoiceId);
  }

  /**
   * Recalculate invoice totals
   */
  async recalculateInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);
    
    // Recalculate each item
    for (const item of invoice.items) {
      item.calculateTotals();
      await this.invoiceItemRepository.save(item);
    }

    // Recalculate invoice totals
    invoice.calculateTotals();
    
    const savedInvoice = await this.invoiceRepository.save(invoice);
    return this.findOne(savedInvoice.id);
  }

  // ==================== STATUS MANAGEMENT ====================

  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    invoice.status = InvoiceStatus.SENT;
    const savedInvoice = await this.invoiceRepository.save(invoice);
    
    // TODO: Implement email sending logic here
    // await this.emailService.sendInvoice(invoice);

    return this.findOne(savedInvoice.id);
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, paymentDto: PaymentDto): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);

    if (invoice.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Invoice is already marked as paid');
    }

    // Update payment information
    invoice.paymentStatus = PaymentStatus.PAID;
    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date(paymentDto.paymentDate);
    
    if (paymentDto.paymentMethod) {
      invoice.paymentMethod = paymentDto.paymentMethod;
    }

    if (paymentDto.notes) {
      invoice.notes = invoice.notes 
        ? `${invoice.notes}\n\nPayment: ${paymentDto.notes}`
        : `Payment: ${paymentDto.notes}`;
    }

    const savedInvoice = await this.invoiceRepository.save(invoice);
    return this.findOne(savedInvoice.id);
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string, cancelDto: CancelInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel paid invoices');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.notes = invoice.notes 
      ? `${invoice.notes}\n\nCancelled: ${cancelDto.reason}`
      : `Cancelled: ${cancelDto.reason}`;

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // TODO: Create corrective invoice if requested
    if (cancelDto.createCorrective) {
      // await this.createCorrectiveInvoice(invoice);
    }

    return this.findOne(savedInvoice.id);
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(dateRange?: { startDate: Date; endDate: Date }): Promise<InvoiceStatistics> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice');

    if (dateRange) {
      queryBuilder.andWhere('invoice.issueDate BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    }

    const invoices = await queryBuilder.getMany();
    
    const stats: InvoiceStatistics = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalGross, 0),
      paidAmount: invoices
        .filter(inv => inv.paymentStatus === PaymentStatus.PAID)
        .reduce((sum, inv) => sum + inv.totalGross, 0),
      pendingAmount: invoices
        .filter(inv => inv.paymentStatus === PaymentStatus.PENDING)
        .reduce((sum, inv) => sum + inv.totalGross, 0),
      overdueAmount: invoices
        .filter(inv => inv.isOverdue)
        .reduce((sum, inv) => sum + inv.totalGross, 0),
      averageInvoiceValue: 0,
      paymentRate: 0,
      overdueRate: 0,
      monthlyStats: []
    };

    // Calculate derived statistics
    if (stats.totalInvoices > 0) {
      stats.averageInvoiceValue = stats.totalAmount / stats.totalInvoices;
      stats.paymentRate = (stats.paidAmount / stats.totalAmount) * 100;
      stats.overdueRate = (stats.overdueAmount / stats.totalAmount) * 100;
    }

    return stats;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: {
        dueDate: LessThanOrEqual(new Date()),
        paymentStatus: PaymentStatus.PENDING
      },
      relations: ['items'],
      order: { dueDate: 'ASC' }
    });
  }

  /**
   * Get VAT report for specified period
   */
  async getVATReport(startDate: Date, endDate: Date): Promise<VATReport> {
    const invoices = await this.invoiceRepository.find({
      where: {
        issueDate: Between(startDate, endDate),
        status: InvoiceStatus.SENT
      },
      relations: ['items']
    });

    const allItems = invoices.flatMap(inv => inv.items);
    const vatSummary = VATCalculator.calculateInvoiceVATSummary(
      allItems.map(item => ({
        netAmount: item.totalNet,
        vatRate: item.vatRate
      }))
    );

    const vatBreakdown = vatSummary.vatBreakdown.map(breakdown => ({
      vatRate: breakdown.vatRate,
      netAmount: breakdown.netAmount,
      vatAmount: breakdown.vatAmount,
      grossAmount: breakdown.grossAmount,
      invoiceCount: invoices.filter(inv => 
        inv.items.some(item => item.vatRate === breakdown.vatRate)
      ).length
    }));

    return {
      period: { startDate, endDate },
      summary: {
        totalNet: vatSummary.totalNet,
        totalVAT: vatSummary.totalVAT,
        totalGross: vatSummary.totalGross
      },
      vatBreakdown,
      invoices
    };
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(contactId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { contactId },
      relations: ['items'],
      order: { issueDate: 'DESC' }
    });
  }

  // ==================== HELPER METHODS ====================

  private getDefaultDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
    return dueDate;
  }

  private getDefaultPaymentTerms(): string {
    return 'Płatność w terminie 30 dni od daty wystawienia faktury';
  }

  private formatCustomerAddress(contact: any): string {
    const parts = [
      contact.street_address,
      contact.postal_code,
      contact.city,
      contact.voivodeship,
      'Poland'
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  private getPricingUnit(pricingModel: string): string {
    const unitMap = {
      'per_m2': 'm²',
      'hourly': 'hour',
      'daily': 'day',
      'project': 'project',
      'per_room': 'room'
    };
    
    return unitMap[pricingModel] || 'm²';
  }

  private convertSellingUnit(sellingUnit: string): string {
    const unitMap = {
      'per_m2': 'm²',
      'per_piece': 'szt',
      'per_package': 'opak',
      'per_meter': 'm'
    };
    
    return unitMap[sellingUnit] || sellingUnit;
  }
}