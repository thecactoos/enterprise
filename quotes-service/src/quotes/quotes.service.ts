import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteItem, ItemType } from './entities/quote-item.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { ServiceMatcher, ProductInfo, ServiceInfo } from './utils/service-matcher';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private readonly quoteItemsRepository: Repository<QuoteItem>,
    private readonly serviceMatcher: ServiceMatcher,
  ) {}

  async create(createQuoteDto: CreateQuoteDto, userId?: string): Promise<Quote> {
    const quote = new Quote();
    
    // Basic fields
    quote.contactId = createQuoteDto.contactId;
    quote.quoteNumber = await this.generateQuoteNumber();
    quote.status = QuoteStatus.DRAFT;
    quote.createdByUserId = userId;
    quote.assignedUserId = createQuoteDto.assignedUserId || userId;
    
    // Optional fields
    if (createQuoteDto.validUntil) {
      quote.validUntil = createQuoteDto.validUntil;
    }
    
    quote.notes = createQuoteDto.notes;
    quote.internalNotes = createQuoteDto.internalNotes;
    quote.termsAndConditions = createQuoteDto.termsAndConditions;
    
    // Delivery & Payment
    quote.deliveryMethod = createQuoteDto.deliveryMethod;
    quote.deliveryAddress = createQuoteDto.deliveryAddress;
    quote.deliveryCost = createQuoteDto.deliveryCost || 0;
    quote.paymentTerms = createQuoteDto.paymentTerms || 'Przelew 14 dni';
    
    // Discount
    quote.discountPercent = createQuoteDto.discountPercent || 0;
    quote.discountAmount = createQuoteDto.discountAmount || 0;
    
    // Metadata
    quote.projectArea = createQuoteDto.projectArea;
    quote.installationIncluded = createQuoteDto.installationIncluded || false;
    quote.measurementIncluded = createQuoteDto.measurementIncluded || false;
    
    // Save quote first to get ID
    const savedQuote = await this.quotesRepository.save(quote);
    
    // Create quote items
    const items: QuoteItem[] = [];
    for (let i = 0; i < createQuoteDto.items.length; i++) {
      const itemDto = createQuoteDto.items[i];
      const item = new QuoteItem();
      
      item.quoteId = savedQuote.id;
      item.itemType = itemDto.itemType;
      item.productId = itemDto.productId;
      item.position = itemDto.position || (i + 1);
      item.sku = itemDto.sku;
      item.name = itemDto.name;
      item.description = itemDto.description;
      
      // Quantities and units
      item.quantity = itemDto.quantity;
      item.unit = itemDto.unit;
      item.quantityPerPackage = itemDto.quantityPerPackage;
      
      // Pricing
      item.pricePerUnit = itemDto.pricePerUnit;
      item.discount = itemDto.discount || 0;
      item.vatRate = itemDto.vatRate || 23;
      
      // Area calculations
      item.coveragePerUnit = itemDto.coveragePerUnit;
      item.wastePercent = itemDto.wastePercent || 10;
      
      // Calculate prices
      item.calculatePrices();
      
      items.push(item);
    }
    
    // Save all items
    const savedItems = await this.quoteItemsRepository.save(items);
    
    // Calculate quote totals
    await this.calculateQuoteTotals(savedQuote.id);
    
    return this.findOneWithItems(savedQuote.id);
  }

  async findAll(
    contactId?: string,
    status?: QuoteStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ quotes: Quote[]; total: number }> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.items', 'items')
      .orderBy('quote.createdAt', 'DESC');

    if (contactId) {
      queryBuilder.andWhere('quote.contactId = :contactId', { contactId });
    }

    if (status) {
      queryBuilder.andWhere('quote.status = :status', { status });
    }

    queryBuilder.limit(limit).offset(offset);

    const [quotes, total] = await queryBuilder.getManyAndCount();

    return { quotes, total };
  }

  async findOne(id: string): Promise<Quote> {
    return this.findOneWithItems(id);
  }

  private async findOneWithItems(id: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async updateStatus(id: string, status: QuoteStatus, userId?: string): Promise<Quote> {
    const quote = await this.findOneWithItems(id);
    
    // Validate status transitions
    this.validateStatusTransition(quote.status, status);
    
    quote.status = status;
    
    // Set timestamps based on status
    const now = new Date();
    switch (status) {
      case QuoteStatus.SENT:
        quote.sentAt = now;
        break;
      case QuoteStatus.ACCEPTED:
        quote.acceptedAt = now;
        break;
      case QuoteStatus.REJECTED:
        quote.rejectedAt = now;
        break;
    }
    
    await this.quotesRepository.save(quote);
    return quote;
  }

  async createRevision(id: string, userId?: string): Promise<Quote> {
    const originalQuote = await this.findOneWithItems(id);
    
    if (!originalQuote.canBeEdited) {
      throw new BadRequestException('Quote cannot be edited in current status');
    }
    
    // Create new version
    const newQuote = new Quote();
    
    // Copy all fields except ID, version, and timestamps
    Object.assign(newQuote, originalQuote);
    delete newQuote.id;
    delete newQuote.createdAt;
    delete newQuote.updatedAt;
    
    newQuote.version = originalQuote.version + 1;
    newQuote.previousVersionId = originalQuote.id;
    newQuote.status = QuoteStatus.DRAFT;
    newQuote.sentAt = null;
    newQuote.acceptedAt = null;
    newQuote.rejectedAt = null;
    
    // Generate new quote number with version suffix
    newQuote.quoteNumber = `${originalQuote.quoteNumber.split('-v')[0]}-v${newQuote.version}`;
    
    const savedQuote = await this.quotesRepository.save(newQuote);
    
    // Copy items
    const newItems: QuoteItem[] = [];
    for (const originalItem of originalQuote.items) {
      const newItem = new QuoteItem();
      Object.assign(newItem, originalItem);
      delete newItem.id;
      delete newItem.createdAt;
      delete newItem.updatedAt;
      
      newItem.quoteId = savedQuote.id;
      newItems.push(newItem);
    }
    
    await this.quoteItemsRepository.save(newItems);
    
    return this.findOneWithItems(savedQuote.id);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.findOneWithItems(id);
    
    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Cannot delete accepted quote');
    }
    
    await this.quotesRepository.remove(quote);
  }

  async getStatistics(contactId?: string): Promise<any> {
    const queryBuilder = this.quotesRepository
      .createQueryBuilder('quote');

    if (contactId) {
      queryBuilder.where('quote.contactId = :contactId', { contactId });
    }

    const totalQuotes = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('quote.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('quote.status')
      .getRawMany();

    const financialStats = await queryBuilder
      .select('SUM(quote.totalGross)', 'totalValue')
      .addSelect('AVG(quote.totalGross)', 'averageValue')
      .addSelect('COUNT(CASE WHEN quote.status = :accepted THEN 1 END)', 'acceptedCount')
      .addSelect('SUM(CASE WHEN quote.status = :accepted THEN quote.totalGross ELSE 0 END)', 'acceptedValue')
      .setParameter('accepted', QuoteStatus.ACCEPTED)
      .getRawOne();

    const conversionRate = totalQuotes > 0 
      ? (parseInt(financialStats.acceptedCount) / totalQuotes * 100).toFixed(2)
      : '0.00';

    return {
      totalQuotes,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      financialSummary: {
        totalValue: parseFloat(financialStats.totalValue) || 0,
        averageValue: parseFloat(financialStats.averageValue) || 0,
        acceptedValue: parseFloat(financialStats.acceptedValue) || 0,
        conversionRate: parseFloat(conversionRate)
      }
    };
  }

  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last quote number for this month
    const lastQuote = await this.quotesRepository
      .createQueryBuilder('quote')
      .where('quote.quoteNumber LIKE :pattern', { 
        pattern: `OF/${year}/${month}/%` 
      })
      .orderBy('quote.quoteNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastQuote && lastQuote.quoteNumber) {
      const parts = lastQuote.quoteNumber.split('/');
      if (parts.length >= 4) {
        const lastSequence = parseInt(parts[3].split('-')[0]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    return `OF/${year}/${month}/${String(sequence).padStart(4, '0')}`;
  }

  private validateStatusTransition(currentStatus: QuoteStatus, newStatus: QuoteStatus): void {
    const validTransitions = {
      [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.CANCELLED],
      [QuoteStatus.SENT]: [QuoteStatus.NEGOTIATION, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED],
      [QuoteStatus.NEGOTIATION]: [QuoteStatus.SENT, QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.CANCELLED],
      [QuoteStatus.ACCEPTED]: [], // Terminal state
      [QuoteStatus.REJECTED]: [], // Terminal state
      [QuoteStatus.EXPIRED]: [QuoteStatus.NEGOTIATION], // Can reopen expired quotes
      [QuoteStatus.CANCELLED]: [] // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get suggested services for a product
   */
  async getSuggestedServices(productId: string, productName: string, productCategory?: string): Promise<ServiceInfo[]> {
    const productInfo: ProductInfo = {
      id: productId,
      name: productName,
      category: productCategory || 'flooring',
    };

    return this.serviceMatcher.matchProductToServices(productInfo);
  }

  /**
   * Add service items to a quote based on project area
   */
  async addServicesToQuote(
    quoteId: string,
    serviceCodes: string[],
    projectArea?: number,
    userId?: string
  ): Promise<Quote> {
    const quote = await this.findOneWithItems(quoteId);
    
    if (!quote.canBeEdited) {
      throw new BadRequestException('Quote cannot be edited in current status');
    }

    // Get the current highest position
    const maxPosition = quote.items.length > 0 
      ? Math.max(...quote.items.map(item => item.position))
      : 0;

    // Use projectArea from quote if not provided
    const area = projectArea || quote.projectArea || 1;

    const serviceItems: QuoteItem[] = [];
    
    for (let i = 0; i < serviceCodes.length; i++) {
      const serviceCode = serviceCodes[i];
      const service = await this.serviceMatcher.getServiceByCode(serviceCode);
      
      if (!service) {
        this.logger.warn(`Service not found: ${serviceCode}`);
        continue;
      }

      const serviceItem = new QuoteItem();
      serviceItem.quoteId = quote.id;
      serviceItem.itemType = ItemType.SERVICE;
      serviceItem.serviceId = service.id;
      serviceItem.serviceCode = service.serviceCode;
      serviceItem.position = maxPosition + i + 1;
      serviceItem.name = service.serviceName;
      serviceItem.description = `${service.serviceName} - ${area}m²`;
      
      // Calculate quantity based on area and minimum charge
      const basePrice = parseFloat(service.basePricePerM2.toString());
      const minCharge = parseFloat(service.minimumCharge.toString());
      const totalServiceCost = Math.max(basePrice * area, minCharge);
      
      // For services, we typically charge per m² or as a fixed service
      if (service.category === 'transport') {
        serviceItem.quantity = 1;
        serviceItem.unit = 'usługa';
        serviceItem.pricePerUnit = totalServiceCost;
      } else {
        serviceItem.quantity = area;
        serviceItem.unit = 'm²';
        serviceItem.pricePerUnit = basePrice;
        
        // Apply minimum charge if needed
        if (totalServiceCost > basePrice * area) {
          serviceItem.pricePerUnit = totalServiceCost / area;
        }
      }
      
      serviceItem.discount = 0;
      serviceItem.vatRate = 23; // Standard VAT for services in Poland
      
      // Calculate prices
      serviceItem.calculatePrices();
      
      serviceItems.push(serviceItem);
    }

    if (serviceItems.length > 0) {
      await this.quoteItemsRepository.save(serviceItems);
      await this.calculateQuoteTotals(quote.id);
      
      this.logger.log(`Added ${serviceItems.length} service items to quote ${quote.quoteNumber}`);
    }

    return this.findOneWithItems(quote.id);
  }

  /**
   * Auto-suggest and add installation services based on products in quote
   */
  async autoSuggestServices(quoteId: string, includeTransport: boolean = true): Promise<Quote> {
    const quote = await this.findOneWithItems(quoteId);
    
    if (!quote.canBeEdited) {
      throw new BadRequestException('Quote cannot be edited in current status');
    }

    const productItems = quote.items.filter(item => item.itemType === ItemType.PRODUCT);
    const suggestedServices = new Set<string>();

    // Get installation services for each product
    for (const productItem of productItems) {
      if (productItem.productId && productItem.name) {
        const productInfo: ProductInfo = {
          id: productItem.productId,
          name: productItem.name,
          category: 'flooring'
        };

        const services = await this.serviceMatcher.matchProductToServices(productInfo);
        
        // Add the best matching service (first one, as they're sorted by price)
        if (services.length > 0) {
          suggestedServices.add(services[0].serviceCode);
        }
      }
    }

    // Add transport service if requested and not already present
    if (includeTransport) {
      const transportService = await this.serviceMatcher.getTransportService();
      if (transportService) {
        suggestedServices.add(transportService.serviceCode);
      }
    }

    // Add baseboard services if installation is included
    if (quote.installationIncluded) {
      const baseboardServices = await this.serviceMatcher.getBaseboardServices();
      if (baseboardServices.length > 0) {
        // Add the most affordable baseboard service
        suggestedServices.add(baseboardServices[0].serviceCode);
      }
    }

    if (suggestedServices.size > 0) {
      return this.addServicesToQuote(
        quoteId, 
        Array.from(suggestedServices),
        quote.projectArea
      );
    }

    return quote;
  }

  /**
   * Remove service item from quote
   */
  async removeServiceFromQuote(quoteId: string, serviceItemId: string): Promise<Quote> {
    const quote = await this.findOneWithItems(quoteId);
    
    if (!quote.canBeEdited) {
      throw new BadRequestException('Quote cannot be edited in current status');
    }

    const serviceItem = quote.items.find(item => 
      item.id === serviceItemId && item.itemType === ItemType.SERVICE
    );

    if (!serviceItem) {
      throw new NotFoundException('Service item not found in quote');
    }

    await this.quoteItemsRepository.remove(serviceItem);
    await this.calculateQuoteTotals(quote.id);

    return this.findOneWithItems(quote.id);
  }

  private async calculateQuoteTotals(quoteId: string): Promise<void> {
    const quote = await this.findOneWithItems(quoteId);
    
    let subtotalNet = 0;
    let subtotalGross = 0;
    let totalVat = 0;

    for (const item of quote.items) {
      subtotalNet += parseFloat(item.netPrice.toString());
      subtotalGross += parseFloat(item.grossPrice.toString());
      totalVat += parseFloat(item.vatAmount.toString());
    }

    // Apply quote-level discount if any
    if (quote.discountPercent > 0) {
      quote.discountAmount = (subtotalNet * quote.discountPercent) / 100;
    }

    quote.subtotalNet = subtotalNet;
    quote.subtotalGross = subtotalGross;
    quote.totalNet = subtotalNet - (quote.discountAmount || 0) + (quote.deliveryCost || 0);
    quote.vatAmount = totalVat;
    quote.totalGross = quote.totalNet + totalVat;

    await this.quotesRepository.save(quote);
  }
}