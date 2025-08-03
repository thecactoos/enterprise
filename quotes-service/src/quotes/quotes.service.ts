import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteItem, ItemType } from './entities/quote-item.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { CreateUnifiedQuoteDto, ProductSelectionDto, RoomCalculationDto, QuotePreferencesDto } from './dto/create-unified-quote.dto';
import { CreateSimpleQuoteDto, SimpleQuoteResponse } from './dto/create-simple-quote.dto';
import { ServiceMatcher, ProductInfo, ServiceInfo } from './utils/service-matcher';
import { PricingService } from './services/pricing.service';
import { QuoteItemsGeneratorService } from './services/quote-items-generator.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private readonly quoteItemsRepository: Repository<QuoteItem>,
    private readonly serviceMatcher: ServiceMatcher,
    private readonly pricingService: PricingService,
    private readonly quoteItemsGenerator: QuoteItemsGeneratorService,
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

  /**
   * Create unified quote with products and services in one intelligent operation
   */
  async createUnifiedQuote(
    createUnifiedQuoteDto: CreateUnifiedQuoteDto,
    userId?: string
  ): Promise<Quote> {
    this.logger.log(`Creating unified quote for contact: ${createUnifiedQuoteDto.contactId}`);

    // Step 1: Fetch product details from products-service
    const productDetails = await this.fetchProductDetails(createUnifiedQuoteDto.products);
    
    // Step 2: Calculate areas and quantities
    const calculatedData = this.calculateMaterialRequirements(
      createUnifiedQuoteDto.products,
      createUnifiedQuoteDto.rooms
    );

    // Step 3: Create base quote
    const quote = new Quote();
    quote.contactId = createUnifiedQuoteDto.contactId;
    // Let database trigger generate quote number
    quote.status = QuoteStatus.DRAFT;
    quote.createdByUserId = userId;
    quote.assignedUserId = userId;
    
    // Optional fields from DTO
    quote.notes = createUnifiedQuoteDto.title || 'Oferta Automatyczna';
    quote.internalNotes = createUnifiedQuoteDto.description;
    
    // Calculate total project area from rooms or products
    quote.projectArea = calculatedData.totalArea;
    
    // Set preferences
    const preferences = createUnifiedQuoteDto.preferences || {};
    quote.installationIncluded = preferences.includeInstallation !== false;
    quote.measurementIncluded = false; // Can be extended later
    
    const savedQuote = await this.quotesRepository.save(quote);

    // Step 4: Create product items
    const productItems = await this.createProductItems(
      savedQuote.id,
      productDetails,
      calculatedData.productQuantities
    );

    // Step 5: Match and add services
    const serviceItems = await this.createServiceItems(
      savedQuote.id,
      productDetails,
      calculatedData.totalArea,
      preferences,
      productItems.length
    );

    // Step 6: Save all items
    const allItems = [...productItems, ...serviceItems];
    await this.quoteItemsRepository.save(allItems);

    // Step 7: Calculate totals
    await this.calculateQuoteTotals(savedQuote.id);

    this.logger.log(`Created unified quote ${savedQuote.quoteNumber} with ${productItems.length} products and ${serviceItems.length} services`);
    
    return this.findOneWithItems(savedQuote.id);
  }

  /**
   * Fetch product details from products-service (mock implementation)
   */
  private async fetchProductDetails(productSelections: ProductSelectionDto[]): Promise<any[]> {
    // TODO: Replace with actual HTTP call to products-service
    const mockProducts = productSelections.map(selection => ({
      id: selection.productId,
      name: `Product ${selection.productId.substring(0, 8)}`,
      sku: `SKU-${selection.productId.substring(0, 8)}`,
      category: 'flooring',
      pricePerUnit: 25.00,
      unit: 'm²',
      coveragePerUnit: 1.0,
      vatRate: 23
    }));

    this.logger.log(`Fetched ${mockProducts.length} product details`);
    return mockProducts;
  }

  /**
   * Calculate material requirements based on rooms and product specifications
   */
  private calculateMaterialRequirements(
    products: ProductSelectionDto[],
    rooms?: RoomCalculationDto[]
  ): { totalArea: number; productQuantities: Map<string, number> } {
    let totalArea = 0;
    const productQuantities = new Map<string, number>();

    // If rooms are provided, calculate area from room dimensions
    if (rooms && rooms.length > 0) {
      totalArea = rooms.reduce((sum, room) => {
        const roomArea = room.length * room.width;
        const wastePercent = room.wastePercent || 10;
        const areaWithWaste = roomArea * (1 + wastePercent / 100);
        return sum + areaWithWaste;
      }, 0);

      // Distribute area across products (simplified - equal distribution)
      const areaPerProduct = totalArea / products.length;
      products.forEach(product => {
        productQuantities.set(product.productId, areaPerProduct);
      });
    } else {
      // Use quantities and areas from product selections
      products.forEach(product => {
        const quantity = product.area || product.quantity;
        productQuantities.set(product.productId, quantity);
        totalArea += quantity;
      });
    }

    this.logger.log(`Calculated total area: ${totalArea.toFixed(2)}m²`);
    return { totalArea, productQuantities };
  }

  /**
   * Create quote items for products
   */
  private async createProductItems(
    quoteId: string,
    productDetails: any[],
    productQuantities: Map<string, number>
  ): Promise<QuoteItem[]> {
    const items: QuoteItem[] = [];

    for (let i = 0; i < productDetails.length; i++) {
      const product = productDetails[i];
      const quantity = productQuantities.get(product.id) || 1;

      const item = new QuoteItem();
      item.quoteId = quoteId;
      item.itemType = ItemType.PRODUCT;
      item.productId = product.id;
      item.position = i + 1;
      item.sku = product.sku;
      item.name = product.name;
      item.description = `${product.name} - ${quantity.toFixed(2)}${product.unit}`;
      
      item.quantity = quantity;
      item.unit = product.unit;
      item.pricePerUnit = product.pricePerUnit;
      item.discount = 0;
      item.vatRate = product.vatRate || 23;
      
      item.coveragePerUnit = product.coveragePerUnit || 1;
      item.wastePercent = 10;
      
      item.calculatePrices();
      items.push(item);
    }

    return items;
  }

  /**
   * Create quote items for services based on products and preferences
   */
  private async createServiceItems(
    quoteId: string,
    productDetails: any[],
    totalArea: number,
    preferences: QuotePreferencesDto,
    startPosition: number
  ): Promise<QuoteItem[]> {
    const serviceItems: QuoteItem[] = [];
    let position = startPosition + 1;

    // Add installation services if requested
    if (preferences.includeInstallation !== false) {
      const installationService = await this.createInstallationServiceItem(
        quoteId,
        totalArea,
        position++,
        preferences.serviceLevel || 'standard'
      );
      if (installationService) {
        serviceItems.push(installationService);
      }
    }

    // Add transport service if requested
    if (preferences.includeTransport !== false) {
      const transportService = await this.createTransportServiceItem(
        quoteId,
        totalArea,
        position++
      );
      if (transportService) {
        serviceItems.push(transportService);
      }
    }

    // Add baseboard service if requested
    if (preferences.includeBaseboard === true) {
      const baseboardService = await this.createBaseboardServiceItem(
        quoteId,
        totalArea,
        position++,
        preferences.serviceLevel || 'standard'
      );
      if (baseboardService) {
        serviceItems.push(baseboardService);
      }
    }

    return serviceItems;
  }

  /**
   * Create installation service item
   */
  private async createInstallationServiceItem(
    quoteId: string,
    area: number,
    position: number,
    serviceLevel: string
  ): Promise<QuoteItem | null> {
    // Get base price based on service level
    const basePrices = {
      basic: 15.00,
      standard: 25.00,
      premium: 40.00
    };

    const basePrice = basePrices[serviceLevel] || basePrices.standard;
    const minimumCharge = 500; // Minimum charge for installation

    const item = new QuoteItem();
    item.quoteId = quoteId;
    item.itemType = ItemType.SERVICE;
    item.position = position;
    item.name = `Montaż ${serviceLevel === 'premium' ? 'Premium' : 'Standardowy'}`;
    item.description = `Profesjonalny montaż podłogi - ${area.toFixed(2)}m²`;
    
    const totalCost = Math.max(basePrice * area, minimumCharge);
    
    if (totalCost === minimumCharge && area > 0) {
      // Apply minimum charge
      item.quantity = 1;
      item.unit = 'usługa';
      item.pricePerUnit = minimumCharge;
    } else {
      item.quantity = area;
      item.unit = 'm²';
      item.pricePerUnit = basePrice;
    }
    
    item.discount = 0;
    item.vatRate = 23;
    item.calculatePrices();

    return item;
  }

  /**
   * Create transport service item
   */
  private async createTransportServiceItem(
    quoteId: string,
    area: number,
    position: number
  ): Promise<QuoteItem | null> {
    const item = new QuoteItem();
    item.quoteId = quoteId;
    item.itemType = ItemType.SERVICE;
    item.position = position;
    item.name = 'Transport i dostawa';
    item.description = 'Dostawa materiałów na adres klienta';
    
    // Fixed transport cost based on area
    const transportCost = area > 50 ? 200 : area > 20 ? 150 : 100;
    
    item.quantity = 1;
    item.unit = 'usługa';
    item.pricePerUnit = transportCost;
    item.discount = 0;
    item.vatRate = 23;
    item.calculatePrices();

    return item;
  }

  /**
   * Create baseboard service item
   */
  private async createBaseboardServiceItem(
    quoteId: string,
    area: number,
    position: number,
    serviceLevel: string
  ): Promise<QuoteItem | null> {
    // Estimate baseboard length (perimeter) from area (rough calculation)
    const estimatedPerimeter = Math.sqrt(area) * 4;
    
    const basePrices = {
      basic: 8.00,
      standard: 12.00,
      premium: 18.00
    };

    const basePrice = basePrices[serviceLevel] || basePrices.standard;

    const item = new QuoteItem();
    item.quoteId = quoteId;
    item.itemType = ItemType.SERVICE;
    item.position = position;
    item.name = `Montaż listew ${serviceLevel === 'premium' ? 'Premium' : 'Standardowy'}`;
    item.description = `Montaż listew przypodłogowych - ${estimatedPerimeter.toFixed(1)}mb`;
    
    item.quantity = estimatedPerimeter;
    item.unit = 'mb';
    item.pricePerUnit = basePrice;
    item.discount = 0;
    item.vatRate = 23;
    item.calculatePrices();

    return item;
  }

  private async calculateQuoteTotals(quoteId: string): Promise<void> {
    // Let the database trigger handle the calculation automatically
    // The trigger will recalculate totals when quote_items are inserted/updated
    this.logger.log(`Quote totals will be calculated by database trigger for quote ${quoteId}`);
  }

  /**
   * Create simplified quote with automatic item generation
   */
  async createSimpleQuote(createSimpleQuoteDto: CreateSimpleQuoteDto, userId: string): Promise<SimpleQuoteResponse> {
    this.logger.log(`Creating simple quote for user ${userId}`, createSimpleQuoteDto);

    // Get pricing for the product
    const pricing = await this.pricingService.getPrices(createSimpleQuoteDto.product_id);

    // Generate items based on pricing and installation preference
    const items = this.quoteItemsGenerator.generateItems(
      createSimpleQuoteDto.area,
      pricing,
      createSimpleQuoteDto.with_installation
    );

    // Create minimal quote record for tracking (optional - depends on requirements)
    const quote = new Quote();
    quote.contactId = createSimpleQuoteDto.client_id;
    quote.quoteNumber = await this.generateQuoteNumber();
    quote.status = QuoteStatus.DRAFT;
    quote.createdByUserId = userId;
    quote.assignedUserId = userId;
    quote.projectArea = createSimpleQuoteDto.area;
    quote.installationIncluded = createSimpleQuoteDto.with_installation;
    quote.paymentTerms = 'Przelew 14 dni';

    const savedQuote = await this.quotesRepository.save(quote);

    // Return the simplified response
    return {
      id: savedQuote.id,
      client_id: createSimpleQuoteDto.client_id,
      product_id: createSimpleQuoteDto.product_id,
      area: createSimpleQuoteDto.area,
      with_installation: createSimpleQuoteDto.with_installation,
      created_by_user_id: userId,
      created_at: savedQuote.createdAt,
      items
    };
  }
}