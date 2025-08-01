import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Service, ServiceStatus } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';

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

    const service = this.servicesRepository.create({
      ...createServiceDto,
      status: createServiceDto.status || ServiceStatus.ACTIVE
    });

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
  async calculateServiceCost(serviceId: string, areaM2: number) {
    if (areaM2 <= 0) {
      throw new BadRequestException('Area must be greater than 0');
    }

    const service = await this.findOne(serviceId);
    const totalPrice = service.calculateTotalPrice(areaM2);
    const totalTime = service.calculateTotalTime(areaM2);

    return {
      service: {
        id: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        displayName: service.displayName
      },
      calculation: {
        areaM2,
        pricePerM2: service.basePricePerM2,
        baseTotal: service.basePricePerM2 * areaM2,
        minimumCharge: service.minimumCharge,
        finalTotal: totalPrice,
        timePerM2Minutes: service.timePerM2Minutes,
        totalTimeMinutes: totalTime,
        formattedTotal: `${totalPrice.toFixed(2).replace('.', ',')} PLN`,
        formattedTime: totalTime >= 60 
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
}