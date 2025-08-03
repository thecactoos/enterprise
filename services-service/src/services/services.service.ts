import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Service, ServiceStatus, PricingTier, RegionalZone, VatRate, ServiceCategory } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { 
  PricingCalculationDto, 
  BulkPricingUpdateDto, 
  RegionalPricingDto,
  SeasonalAdjustmentDto,
  PricingTierUpdateDto,
  VolumeDiscountDto 
} from './dto/pricing-calculation.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Check if service code already exists
    const existingService = await this.servicesRepository.findOne({
      where: { serviceCode: createServiceDto.serviceCode }
    });

    if (existingService) {
      throw new ConflictException(`Service with code ${createServiceDto.serviceCode} already exists`);
    }

    // Auto-calculate pricing tiers if not provided
    const serviceData = {
      ...createServiceDto,
      status: createServiceDto.status || ServiceStatus.ACTIVE,
      pricingTier: createServiceDto.pricingTier || PricingTier.STANDARD,
      vatRate: createServiceDto.vatRate ?? VatRate.STANDARD,
      standardPrice: createServiceDto.standardPrice || (createServiceDto.basePricePerM2 * 1.15),
      premiumPrice: createServiceDto.premiumPrice || (createServiceDto.basePricePerM2 * 1.25),
      regionalMultiplier: createServiceDto.regionalMultiplier || 1.0,
      seasonalAdjustmentActive: createServiceDto.seasonalAdjustmentActive || false,
      seasonalMultiplier: createServiceDto.seasonalMultiplier || 1.0
    };

    const service = this.servicesRepository.create(serviceData);
    return await this.servicesRepository.save(service);
  }

  async findAll(query: ServiceQueryDto) {
    const { 
      page = 1, 
      limit = 20, 
      category,
      material,
      installationMethod,
      flooringForm,
      pattern,
      status,
      search,
      minPrice,
      maxPrice,
      minSkillLevel,
      maxSkillLevel,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query;

    const queryBuilder = this.servicesRepository.createQueryBuilder('service');

    // Apply filters
    if (category) {
      queryBuilder.andWhere('service.category = :category', { category });
    }

    if (material) {
      queryBuilder.andWhere('service.material = :material', { material });
    }

    if (installationMethod) {
      queryBuilder.andWhere('service.installationMethod = :installationMethod', { installationMethod });
    }

    if (flooringForm) {
      queryBuilder.andWhere('service.flooringForm = :flooringForm', { flooringForm });
    }

    if (pattern) {
      queryBuilder.andWhere('service.pattern = :pattern', { pattern });
    }

    if (status) {
      queryBuilder.andWhere('service.status = :status', { status });
    } else {
      // By default, only show active services
      queryBuilder.andWhere('service.status = :defaultStatus', { defaultStatus: ServiceStatus.ACTIVE });
    }

    if (search) {
      queryBuilder.andWhere(
        '(service.serviceName ILIKE :search OR service.description ILIKE :search OR service.serviceCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('service.basePricePerM2 >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('service.basePricePerM2 <= :maxPrice', { maxPrice });
    }

    if (minSkillLevel !== undefined) {
      queryBuilder.andWhere('service.skillLevel >= :minSkillLevel', { minSkillLevel });
    }

    if (maxSkillLevel !== undefined) {
      queryBuilder.andWhere('service.skillLevel <= :maxSkillLevel', { maxSkillLevel });
    }

    // Apply sorting
    const allowedSortFields = ['serviceName', 'basePricePerM2', 'timePerM2Minutes', 'skillLevel', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`service.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [services, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async findByCode(serviceCode: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { serviceCode }
    });

    if (!service) {
      throw new NotFoundException(`Service with code ${serviceCode} not found`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    // Check if updating service code and it conflicts with existing
    if (updateServiceDto.serviceCode && updateServiceDto.serviceCode !== service.serviceCode) {
      const existingService = await this.servicesRepository.findOne({
        where: { serviceCode: updateServiceDto.serviceCode }
      });

      if (existingService) {
        throw new ConflictException(`Service with code ${updateServiceDto.serviceCode} already exists`);
      }
    }

    Object.assign(service, updateServiceDto);
    return await this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
  }

  async deactivate(id: string): Promise<Service> {
    const service = await this.findOne(id);
    service.status = ServiceStatus.INACTIVE;
    return await this.servicesRepository.save(service);
  }

  async activate(id: string): Promise<Service> {
    const service = await this.findOne(id);
    service.status = ServiceStatus.ACTIVE;
    return await this.servicesRepository.save(service);
  }

  // Statistics and analytics methods
  async getServiceStatistics() {
    const [
      totalServices,
      activeServices,
      inactiveServices,
      discontinuedServices,
      categories,
      materials,
      averagePrice,
      averageTime,
      priceRange
    ] = await Promise.all([
      this.servicesRepository.count(),
      this.servicesRepository.count({ where: { status: ServiceStatus.ACTIVE } }),
      this.servicesRepository.count({ where: { status: ServiceStatus.INACTIVE } }),
      this.servicesRepository.count({ where: { status: ServiceStatus.DISCONTINUED } }),
      this.servicesRepository
        .createQueryBuilder('service')
        .select('service.category, COUNT(*) as count')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .groupBy('service.category')
        .getRawMany(),
      this.servicesRepository
        .createQueryBuilder('service')
        .select('service.material, COUNT(*) as count')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .groupBy('service.material')
        .getRawMany(),
      this.servicesRepository
        .createQueryBuilder('service')
        .select('AVG(service.basePricePerM2)', 'avgPrice')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne(),
      this.servicesRepository
        .createQueryBuilder('service')
        .select('AVG(service.timePerM2Minutes)', 'avgTime')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne(),
      this.servicesRepository
        .createQueryBuilder('service')
        .select('MIN(service.basePricePerM2) as minPrice, MAX(service.basePricePerM2) as maxPrice')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne()
    ]);

    return {
      totalServices,
      statusBreakdown: {
        active: activeServices,
        inactive: inactiveServices,
        discontinued: discontinuedServices
      },
      categoryBreakdown: categories,
      materialBreakdown: materials,
      pricing: {
        averagePrice: parseFloat(averagePrice?.avgPrice || '0'),
        minPrice: parseFloat(priceRange?.minPrice || '0'),
        maxPrice: parseFloat(priceRange?.maxPrice || '0')
      },
      timing: {
        averageTimePerM2: parseInt(averageTime?.avgTime || '0')
      }
    };
  }

  // Service calculation methods
  async calculateServiceCost(serviceId: string, areaM2: number, tier: PricingTier = PricingTier.STANDARD, regionalZone: RegionalZone = RegionalZone.OTHER) {
    if (areaM2 <= 0) {
      throw new BadRequestException('Area must be greater than 0');
    }

    const service = await this.findOne(serviceId);
    
    // Use new advanced pricing calculation
    const advancedCalculation = service.calculateAdvancedPrice(areaM2, tier, regionalZone);
    const totalTime = service.calculateTotalTime(areaM2);
    
    // Legacy calculation for backward compatibility
    const legacyPrice = service.calculateTotalPrice(areaM2);

    return {
      service: {
        id: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        displayName: service.displayName,
        category: service.category,
        pricingTier: service.pricingTier,
        vatRate: service.vatRate
      },
      advancedCalculation,
      legacyCalculation: {
        areaM2,
        pricePerM2: service.basePricePerM2,
        baseTotal: service.basePricePerM2 * areaM2,
        minimumCharge: service.minimumCharge,
        finalTotal: legacyPrice,
        timePerM2Minutes: service.timePerM2Minutes,
        totalTimeMinutes: totalTime,
        formattedTotal: `${legacyPrice.toFixed(2).replace('.', ',')} PLN`,
        formattedTime: totalTime >= 60 
          ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}min`
          : `${totalTime} min`
      },
      timing: {
        totalMinutes: totalTime,
        formatted: totalTime >= 60 
          ? `${Math.floor(totalTime / 60)}h ${totalTime % 60}min`
          : `${totalTime} min`
      }
    };
  }

  // Bulk operations
  async bulkUpdateStatus(serviceIds: string[], status: ServiceStatus) {
    const result = await this.servicesRepository
      .createQueryBuilder()
      .update(Service)
      .set({ status })
      .where('id IN (:...serviceIds)', { serviceIds })
      .execute();

    return { updated: result.affected || 0 };
  }

  async bulkEnable(serviceIds: string[]) {
    return this.bulkUpdateStatus(serviceIds, ServiceStatus.ACTIVE);
  }

  async bulkDisable(serviceIds: string[]) {
    return this.bulkUpdateStatus(serviceIds, ServiceStatus.INACTIVE);
  }

  // Popular services (could be used for recommendations)
  async getPopularServices(limit: number = 10) {
    // For now, return most recently created active services
    // In the future, this could be based on usage statistics from quotes/orders
    const services = await this.servicesRepository.find({
      where: { status: ServiceStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: limit
    });

    return services;
  }

  // Services by category for grouped display
  async getServicesByCategory() {
    const services = await this.servicesRepository.find({
      where: { status: ServiceStatus.ACTIVE },
      order: { 
        category: 'ASC', 
        basePricePerM2: 'ASC' 
      }
    });

    // Group by category
    const grouped = services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);

    return grouped;
  }

  // ========================================
  // ADVANCED PRICING METHODS
  // ========================================

  async calculateAdvancedPricing(id: string, calculationDto: PricingCalculationDto) {
    const service = await this.findOne(id);
    const { quantity, tier, regionalZone, applySeasonalAdjustment } = calculationDto;
    
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Use service entity method for advanced calculation
    const advancedCalculation = service.calculateAdvancedPrice(
      quantity, 
      tier || PricingTier.STANDARD, 
      regionalZone || RegionalZone.OTHER
    );

    return {
      service: {
        id: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        category: service.category
      },
      calculation: advancedCalculation,
      requestParams: {
        quantity,
        tier: tier || PricingTier.STANDARD,
        regionalZone: regionalZone || RegionalZone.OTHER,
        applySeasonalAdjustment
      }
    };
  }

  async bulkUpdatePricing(bulkUpdateDto: BulkPricingUpdateDto) {
    const { serviceIds, priceAdjustmentPercent, seasonalMultiplier, seasonalAdjustmentActive, regionalMultiplier, newVatRate } = bulkUpdateDto;
    
    const services = await this.servicesRepository.findBy({
      id: In(serviceIds)
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found');
    }

    const updatePromises = services.map(async (service) => {
      if (priceAdjustmentPercent !== undefined) {
        const newPrice = service.basePricePerM2 * (1 + priceAdjustmentPercent / 100);
        service.basePricePerM2 = Math.max(0, newPrice);
        service.standardPrice = service.basePricePerM2 * 1.15;
        service.premiumPrice = service.basePricePerM2 * 1.25;
      }

      if (seasonalMultiplier !== undefined) {
        service.seasonalMultiplier = seasonalMultiplier;
      }

      if (seasonalAdjustmentActive !== undefined) {
        service.seasonalAdjustmentActive = seasonalAdjustmentActive;
      }

      if (regionalMultiplier !== undefined) {
        service.regionalMultiplier = regionalMultiplier;
      }

      if (newVatRate !== undefined) {
        service.vatRate = newVatRate;
      }
      
      return this.servicesRepository.save(service);
    });

    const updatedServices = await Promise.all(updatePromises);

    return {
      updatedCount: updatedServices.length,
      priceAdjustmentPercent,
      seasonalMultiplier,
      seasonalAdjustmentActive,
      regionalMultiplier,
      newVatRate,
      services: updatedServices.map(s => ({
        id: s.id,
        name: s.serviceName,
        oldPrice: services.find(old => old.id === s.id)?.basePricePerM2,
        newPrice: s.basePricePerM2
      }))
    };
  }

  async updateRegionalPricing(regionalPricingDto: RegionalPricingDto) {
    const { regionalZone, multiplier } = regionalPricingDto;
    
    // Update all services that don't have a specific regional multiplier set
    const result = await this.servicesRepository
      .createQueryBuilder()
      .update(Service)
      .set({ regionalMultiplier: multiplier })
      .where('status = :status', { status: ServiceStatus.ACTIVE })
      .execute();

    return {
      updatedCount: result.affected || 0,
      regionalZone,
      multiplier,
      message: `Updated regional pricing for ${regionalZone} zone`
    };
  }

  async applySeasonalAdjustment(seasonalDto: SeasonalAdjustmentDto) {
    const { multiplier, active, categories } = seasonalDto;
    
    let queryBuilder = this.servicesRepository
      .createQueryBuilder()
      .update(Service)
      .set({ 
        seasonalMultiplier: multiplier,
        seasonalAdjustmentActive: active
      })
      .where('status = :status', { status: ServiceStatus.ACTIVE });

    if (categories && categories.length > 0) {
      queryBuilder = queryBuilder.andWhere('category IN (:...categories)', { categories });
    }

    const result = await queryBuilder.execute();

    return {
      updatedCount: result.affected || 0,
      multiplier,
      active,
      categories: categories || ['all'],
      message: `Applied seasonal adjustment to ${result.affected || 0} services`
    };
  }

  async updatePricingTiers(id: string, pricingTierDto: PricingTierUpdateDto) {
    const service = await this.findOne(id);
    const { basicPrice, standardPrice, premiumPrice, hourlyRate, dailyRate } = pricingTierDto;

    if (basicPrice !== undefined) {
      service.basePricePerM2 = basicPrice;
    }
    
    if (standardPrice !== undefined) {
      service.standardPrice = standardPrice;
    }
    
    if (premiumPrice !== undefined) {
      service.premiumPrice = premiumPrice;
    }

    if (hourlyRate !== undefined) {
      service.hourlyRate = hourlyRate;
    }

    if (dailyRate !== undefined) {
      service.dailyRate = dailyRate;
    }

    const updatedService = await this.servicesRepository.save(service);

    return {
      service: {
        id: updatedService.id,
        name: updatedService.serviceName,
        pricingTier: updatedService.pricingTier,
        prices: {
          base: updatedService.basePricePerM2,
          standard: updatedService.standardPrice,
          premium: updatedService.premiumPrice,
          hourly: updatedService.hourlyRate,
          daily: updatedService.dailyRate
        }
      },
      updated: true
    };
  }

  async updateVolumeDiscount(id: string, volumeDiscountDto: VolumeDiscountDto) {
    const service = await this.findOne(id);
    const { threshold, discountPercent } = volumeDiscountDto;

    // Store volume discount info using correct property names
    service.volumeThreshold = threshold;
    service.volumeDiscountPercent = discountPercent;

    const updatedService = await this.servicesRepository.save(service);

    return {
      service: {
        id: updatedService.id,
        name: updatedService.serviceName,
        volumeDiscount: {
          threshold,
          discountPercent
        }
      },
      updated: true
    };
  }

  async getPricingAnalytics() {
    const [
      averagePrices,
      priceDistribution,
      pricingTierStats,
      regionalStats,
      seasonalStats
    ] = await Promise.all([
      this.servicesRepository
        .createQueryBuilder('service')
        .select([
          'AVG(service.basePricePerM2) as avgBase',
          'AVG(service.standardPrice) as avgStandard', 
          'AVG(service.premiumPrice) as avgPremium',
          'MIN(service.basePricePerM2) as minPrice',
          'MAX(service.basePricePerM2) as maxPrice'
        ])
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne(),
      
      this.servicesRepository
        .createQueryBuilder('service')
        .select([
          'CASE ' +
          'WHEN service.basePricePerM2 < 50 THEN \'Low (< 50 PLN)\' ' +
          'WHEN service.basePricePerM2 < 100 THEN \'Medium (50-100 PLN)\' ' +
          'ELSE \'High (> 100 PLN)\' ' +
          'END as priceRange',
          'COUNT(*) as count'
        ])
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .groupBy('priceRange')
        .getRawMany(),

      this.servicesRepository
        .createQueryBuilder('service')
        .select(['service.pricingTier as tier', 'COUNT(*) as count', 'AVG(service.basePricePerM2) as avgPrice'])
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .groupBy('service.pricingTier')
        .getRawMany(),

      this.servicesRepository
        .createQueryBuilder('service')
        .select(['AVG(service.regionalMultiplier) as avgMultiplier', 'COUNT(*) as servicesCount'])
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne(),

      this.servicesRepository
        .createQueryBuilder('service')
        .select([
          'COUNT(CASE WHEN service.seasonalAdjustmentActive = true THEN 1 END) as activeSeasonals',
          'AVG(service.seasonalMultiplier) as avgSeasonalMultiplier'
        ])
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .getRawOne()
    ]);

    return {
      averagePrices: {
        base: parseFloat(averagePrices.avgBase || '0'),
        standard: parseFloat(averagePrices.avgStandard || '0'),
        premium: parseFloat(averagePrices.avgPremium || '0'),
        min: parseFloat(averagePrices.minPrice || '0'),
        max: parseFloat(averagePrices.maxPrice || '0')
      },
      priceDistribution,
      pricingTierStats: pricingTierStats.map(stat => ({
        tier: stat.tier,
        count: parseInt(stat.count),
        averagePrice: parseFloat(stat.avgPrice || '0')
      })),
      regionalAnalytics: {
        averageMultiplier: parseFloat(regionalStats.avgMultiplier || '1'),
        servicesCount: parseInt(regionalStats.servicesCount || '0')
      },
      seasonalAnalytics: {
        activeSeasonalServices: parseInt(seasonalStats.activeSeasonals || '0'),
        averageSeasonalMultiplier: parseFloat(seasonalStats.avgSeasonalMultiplier || '1')
      }
    };
  }

  async getServicesWithVolumeDiscounts(minThreshold?: number) {
    const queryBuilder = this.servicesRepository
      .createQueryBuilder('service')
      .where('service.status = :status', { status: ServiceStatus.ACTIVE })
      .andWhere('service.volumeThreshold IS NOT NULL')
      .andWhere('service.volumeDiscountPercent > 0');

    if (minThreshold) {
      queryBuilder.andWhere('service.volumeThreshold >= :minThreshold', { minThreshold });
    }

    const services = await queryBuilder
      .orderBy('service.volumeDiscountPercent', 'DESC')
      .getMany();

    return {
      services: services.map(service => ({
        id: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        basePrice: service.basePricePerM2,
        volumeDiscount: {
          threshold: service.volumeThreshold,
          percentage: service.volumeDiscountPercent
        }
      })),
      totalCount: services.length
    };
  }

  async getServicesByPricingTier(tier: PricingTier) {
    const services = await this.servicesRepository.find({
      where: { 
        status: ServiceStatus.ACTIVE,
        pricingTier: tier
      },
      order: { basePricePerM2: 'ASC' }
    });

    return {
      tier,
      services: services.map(service => ({
        id: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        basePrice: service.basePricePerM2,
        standardPrice: service.standardPrice,
        premiumPrice: service.premiumPrice,
        category: service.category
      })),
      totalCount: services.length
    };
  }
}