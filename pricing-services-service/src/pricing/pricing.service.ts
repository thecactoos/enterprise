import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ServicePricing, PriceType, PricingTier } from './service-pricing.entity';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { UpdateServicePricingDto } from './dto/update-service-pricing.dto';
import { ContractorsService } from '../contractors/contractors.service';
import { HistoryService } from '../history/history.service';
import { PriceHistory, ChangeReason } from '../history/price-history.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(ServicePricing)
    private pricingRepository: Repository<ServicePricing>,
    private contractorsService: ContractorsService,
    private historyService: HistoryService,
  ) {}

  async create(createPricingDto: CreateServicePricingDto, userId?: string, userName?: string): Promise<ServicePricing> {
    // Verify contractor exists
    await this.contractorsService.findOne(createPricingDto.contractorId);

    // Check for duplicate service pricing
    const existing = await this.pricingRepository.findOne({
      where: {
        serviceId: createPricingDto.serviceId,
        contractorId: createPricingDto.contractorId,
        priceType: createPricingDto.priceType,
        isActive: true
      }
    });

    if (existing) {
      throw new BadRequestException(
        `Active pricing already exists for this service, contractor, and price type combination`
      );
    }

    const pricing = this.pricingRepository.create({
      ...createPricingDto,
      effectiveFrom: createPricingDto.effectiveFrom ? new Date(createPricingDto.effectiveFrom) : new Date(),
      effectiveTo: createPricingDto.effectiveTo ? new Date(createPricingDto.effectiveTo) : undefined,
    });

    const savedPricing = await this.pricingRepository.save(pricing);

    // Create initial price history entry
    const historyEntry = PriceHistory.createInitialEntry(
      savedPricing.id,
      savedPricing.priceType,
      savedPricing.basePrice
    );

    if (userId) {
      historyEntry.changedByUserId = userId;
      historyEntry.changedByUserName = userName;
      historyEntry.isAutomatic = false;
    }

    await this.historyService.create(historyEntry);

    return await this.findOne(savedPricing.id);
  }

  async findAll(options?: {
    serviceId?: string;
    contractorId?: string;
    priceType?: PriceType;
    pricingTier?: PricingTier;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ServicePricing[]; total: number }> {
    const queryBuilder = this.pricingRepository.createQueryBuilder('pricing');

    // Apply filters
    if (options?.serviceId) {
      queryBuilder.andWhere('pricing.serviceId = :serviceId', { serviceId: options.serviceId });
    }

    if (options?.contractorId) {
      queryBuilder.andWhere('pricing.contractorId = :contractorId', { contractorId: options.contractorId });
    }

    if (options?.priceType) {
      queryBuilder.andWhere('pricing.priceType = :priceType', { priceType: options.priceType });
    }

    if (options?.pricingTier) {
      queryBuilder.andWhere('pricing.pricingTier = :pricingTier', { pricingTier: options.pricingTier });
    }

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('pricing.isActive = :isActive', { isActive: options.isActive });
    }

    if (options?.search) {
      queryBuilder.andWhere(
        '(pricing.notes ILIKE :search OR pricing.currency ILIKE :search)',
        { search: `%${options.search}%` }
      );
    }

    // Add relations
    queryBuilder.leftJoinAndSelect('pricing.contractor', 'contractor');
    queryBuilder.leftJoinAndSelect('pricing.priceHistory', 'priceHistory');

    // Apply pagination
    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    // Order by creation date
    queryBuilder.orderBy('pricing.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<ServicePricing> {
    const pricing = await this.pricingRepository.findOne({
      where: { id },
      relations: ['contractor', 'priceHistory']
    });

    if (!pricing) {
      throw new NotFoundException(`Service pricing with ID ${id} not found`);
    }

    return pricing;
  }

  async findByService(serviceId: string): Promise<ServicePricing[]> {
    return await this.pricingRepository.find({
      where: { serviceId, isActive: true },
      relations: ['contractor', 'priceHistory'],
      order: { basePrice: 'ASC' }
    });
  }

  async findByContractor(contractorId: string): Promise<ServicePricing[]> {
    return await this.pricingRepository.find({
      where: { contractorId, isActive: true },
      relations: ['contractor', 'priceHistory'],
      order: { basePrice: 'ASC' }
    });
  }

  async findByPriceType(priceType: PriceType): Promise<ServicePricing[]> {
    return await this.pricingRepository.find({
      where: { priceType, isActive: true },
      relations: ['contractor', 'priceHistory'],
      order: { basePrice: 'ASC' }
    });
  }

  async findActiveForService(serviceId: string, date: Date = new Date()): Promise<ServicePricing[]> {
    const queryBuilder = this.pricingRepository.createQueryBuilder('pricing');
    
    queryBuilder
      .leftJoinAndSelect('pricing.contractor', 'contractor')
      .where('pricing.serviceId = :serviceId', { serviceId })
      .andWhere('pricing.isActive = true')
      .andWhere('pricing.effectiveFrom <= :date', { date })
      .andWhere('(pricing.effectiveTo IS NULL OR pricing.effectiveTo >= :date)', { date })
      .orderBy('pricing.basePrice', 'ASC');

    return await queryBuilder.getMany();
  }

  async update(
    id: string, 
    updatePricingDto: UpdateServicePricingDto,
    userId?: string,
    userName?: string,
    changeReason: ChangeReason = ChangeReason.OTHER
  ): Promise<ServicePricing> {
    const existingPricing = await this.findOne(id);

    // Check if contractor is being changed
    if (updatePricingDto.contractorId && updatePricingDto.contractorId !== existingPricing.contractorId) {
      await this.contractorsService.findOne(updatePricingDto.contractorId);
    }

    // Check for price changes to create history
    const priceChanged = updatePricingDto.basePrice && updatePricingDto.basePrice !== existingPricing.basePrice;
    const purchaseCostChanged = updatePricingDto.purchaseCost !== undefined && 
                                updatePricingDto.purchaseCost !== existingPricing.purchaseCost;
    const retailPriceChanged = updatePricingDto.retailPrice !== undefined && 
                              updatePricingDto.retailPrice !== existingPricing.retailPrice;

    // Update the pricing
    Object.assign(existingPricing, {
      ...updatePricingDto,
      effectiveFrom: updatePricingDto.effectiveFrom ? new Date(updatePricingDto.effectiveFrom) : existingPricing.effectiveFrom,
      effectiveTo: updatePricingDto.effectiveTo ? new Date(updatePricingDto.effectiveTo) : existingPricing.effectiveTo,
    });

    const updatedPricing = await this.pricingRepository.save(existingPricing);

    // Create history entries for price changes
    if (priceChanged || purchaseCostChanged || retailPriceChanged) {
      const historyPromises = [];

      if (priceChanged) {
        const historyEntry = PriceHistory.createUpdateEntry(
          updatedPricing.id,
          updatedPricing.priceType,
          existingPricing.basePrice,
          updatePricingDto.basePrice!,
          changeReason,
          userId,
          userName,
          updatePricingDto.notes
        );
        historyPromises.push(this.historyService.create(historyEntry));
      }

      if (purchaseCostChanged && updatePricingDto.purchaseCost !== undefined) {
        const historyEntry = {
          ...PriceHistory.createUpdateEntry(
            updatedPricing.id,
            PriceType.PURCHASE,
            existingPricing.purchaseCost || 0,
            updatePricingDto.purchaseCost,
            changeReason,
            userId,
            userName,
            'Purchase cost update'
          ),
          oldPurchaseCost: existingPricing.purchaseCost,
          newPurchaseCost: updatePricingDto.purchaseCost
        };
        historyPromises.push(this.historyService.create(historyEntry));
      }

      if (retailPriceChanged && updatePricingDto.retailPrice !== undefined) {
        const historyEntry = {
          ...PriceHistory.createUpdateEntry(
            updatedPricing.id,
            PriceType.RETAIL,
            existingPricing.retailPrice || 0,
            updatePricingDto.retailPrice,
            changeReason,
            userId,
            userName,
            'Retail price update'
          ),
          oldRetailPrice: existingPricing.retailPrice,
          newRetailPrice: updatePricingDto.retailPrice
        };
        historyPromises.push(this.historyService.create(historyEntry));
      }

      await Promise.all(historyPromises);
    }

    return await this.findOne(updatedPricing.id);
  }

  async deactivate(id: string, userId?: string, userName?: string): Promise<ServicePricing> {
    const pricing = await this.findOne(id);
    pricing.isActive = false;

    const updated = await this.pricingRepository.save(pricing);

    // Create history entry for deactivation
    await this.historyService.create({
      servicePricingId: updated.id,
      priceType: updated.priceType,
      oldPrice: updated.basePrice,
      newPrice: updated.basePrice,
      changeReason: ChangeReason.OTHER,
      percentageChange: 0,
      isAutomatic: false,
      changedByUserId: userId,
      changedByUserName: userName,
      effectiveDate: new Date(),
      notes: 'Pricing deactivated'
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    const pricing = await this.findOne(id);
    await this.pricingRepository.remove(pricing);
  }

  async bulkUpdatePrices(
    updates: Array<{
      id: string;
      newPrice: number;
      reason: ChangeReason;
      notes?: string;
    }>,
    userId?: string,
    userName?: string
  ): Promise<ServicePricing[]> {
    const results = [];

    for (const update of updates) {
      const updated = await this.update(
        update.id,
        { basePrice: update.newPrice, notes: update.notes },
        userId,
        userName,
        update.reason
      );
      results.push(updated);
    }

    return results;
  }

  async getCompetitivePricing(serviceId: string): Promise<{
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    contractorCount: number;
    recommendations: string[];
  }> {
    const prices = await this.findActiveForService(serviceId);
    
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        contractorCount: 0,
        recommendations: ['No pricing data available for this service']
      };
    }

    const basePrices = prices.map(p => p.basePrice);
    const averagePrice = basePrices.reduce((a, b) => a + b, 0) / basePrices.length;
    const minPrice = Math.min(...basePrices);
    const maxPrice = Math.max(...basePrices);
    const priceRange = maxPrice - minPrice;

    const recommendations = [];
    
    if (priceRange > averagePrice * 0.5) {
      recommendations.push('High price variance detected - consider standardizing pricing');
    }
    
    if (prices.length < 3) {
      recommendations.push('Limited contractor options - consider adding more contractors');
    }

    const skillDistribution = prices.reduce((acc, p) => {
      const skill = p.contractor?.skillLevel || 3;
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    if (skillDistribution[5] && skillDistribution[1]) {
      recommendations.push('Mix of skill levels available - price accordingly');
    }

    return {
      averagePrice: Math.round(averagePrice * 100) / 100,
      minPrice,
      maxPrice,
      priceRange: Math.round(priceRange * 100) / 100,
      contractorCount: prices.length,
      recommendations
    };
  }

  async getPricingTrends(serviceId: string, days: number = 30): Promise<{
    priceChanges: number;
    averageChange: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: 'low' | 'medium' | 'high';
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.historyService.getPriceChangesInDateRange(startDate, new Date());
    const serviceHistory = history.filter(h => h.servicePricing?.serviceId === serviceId);

    if (serviceHistory.length === 0) {
      return {
        priceChanges: 0,
        averageChange: 0,
        trend: 'stable',
        volatility: 'low'
      };
    }

    const changes = serviceHistory.map(h => h.percentageChange);
    const averageChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (averageChange > 2) trend = 'increasing';
    else if (averageChange < -2) trend = 'decreasing';

    const volatility = Math.abs(averageChange) > 10 ? 'high' : 
                     Math.abs(averageChange) > 5 ? 'medium' : 'low';

    return {
      priceChanges: serviceHistory.length,
      averageChange: Math.round(averageChange * 100) / 100,
      trend,
      volatility
    };
  }
}