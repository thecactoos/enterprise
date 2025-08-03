import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PriceHistory, ChangeReason } from './price-history.entity';
import { PriceType } from '../pricing/service-pricing.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private historyRepository: Repository<PriceHistory>,
  ) {}

  async create(historyData: Partial<PriceHistory>): Promise<PriceHistory> {
    const history = this.historyRepository.create(historyData);
    return await this.historyRepository.save(history);
  }

  async findAll(options?: {
    servicePricingId?: string;
    priceType?: PriceType;
    changeReason?: ChangeReason;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PriceHistory[]; total: number }> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');

    // Apply filters
    if (options?.servicePricingId) {
      queryBuilder.andWhere('history.servicePricingId = :servicePricingId', { 
        servicePricingId: options.servicePricingId 
      });
    }

    if (options?.priceType) {
      queryBuilder.andWhere('history.priceType = :priceType', { priceType: options.priceType });
    }

    if (options?.changeReason) {
      queryBuilder.andWhere('history.changeReason = :changeReason', { 
        changeReason: options.changeReason 
      });
    }

    if (options?.startDate && options?.endDate) {
      queryBuilder.andWhere('history.effectiveDate BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate
      });
    } else if (options?.startDate) {
      queryBuilder.andWhere('history.effectiveDate >= :startDate', { startDate: options.startDate });
    } else if (options?.endDate) {
      queryBuilder.andWhere('history.effectiveDate <= :endDate', { endDate: options.endDate });
    }

    // Add relations
    queryBuilder.leftJoinAndSelect('history.servicePricing', 'servicePricing');
    queryBuilder.leftJoinAndSelect('servicePricing.contractor', 'contractor');

    // Apply pagination
    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    // Order by effective date descending
    queryBuilder.orderBy('history.effectiveDate', 'DESC')
                .addOrderBy('history.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<PriceHistory> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['servicePricing', 'servicePricing.contractor']
    });

    if (!history) {
      throw new NotFoundException(`Price history record with ID ${id} not found`);
    }

    return history;
  }

  async findByServicePricing(servicePricingId: string): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: { servicePricingId },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC', createdAt: 'DESC' }
    });
  }

  async findByContractor(contractorId: string): Promise<PriceHistory[]> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');
    
    queryBuilder
      .leftJoinAndSelect('history.servicePricing', 'servicePricing')
      .leftJoinAndSelect('servicePricing.contractor', 'contractor')
      .where('contractor.id = :contractorId', { contractorId })
      .orderBy('history.effectiveDate', 'DESC')
      .addOrderBy('history.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async getPriceChangesInDateRange(
    startDate: Date, 
    endDate: Date
  ): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: {
        effectiveDate: Between(startDate, endDate)
      },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC' }
    });
  }

  async getSignificantPriceChanges(
    minPercentageChange: number = 10
  ): Promise<PriceHistory[]> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');
    
    queryBuilder
      .leftJoinAndSelect('history.servicePricing', 'servicePricing')
      .leftJoinAndSelect('servicePricing.contractor', 'contractor')
      .where('ABS(history.percentageChange) >= :minChange', { minChange: minPercentageChange })
      .orderBy('ABS(history.percentageChange)', 'DESC')
      .addOrderBy('history.effectiveDate', 'DESC');

    return await queryBuilder.getMany();
  }

  async getPriceChangesByReason(reason: ChangeReason): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: { changeReason: reason },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC' }
    });
  }

  async getAutomaticChanges(): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: { isAutomatic: true },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC' }
    });
  }

  async getManualChanges(): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: { isAutomatic: false },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC' }
    });
  }

  async getChangesByUser(userId: string): Promise<PriceHistory[]> {
    return await this.historyRepository.find({
      where: { changedByUserId: userId },
      relations: ['servicePricing', 'servicePricing.contractor'],
      order: { effectiveDate: 'DESC' }
    });
  }

  async getPriceHistoryStats(options?: {
    contractorId?: string;
    priceType?: PriceType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalChanges: number;
    averagePercentageChange: number;
    significantChanges: number;
    automaticChanges: number;
    manualChanges: number;
    reasonBreakdown: { [key in ChangeReason]?: number };
    lastChange: Date | null;
  }> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');

    // Apply filters
    if (options?.contractorId) {
      queryBuilder
        .leftJoin('history.servicePricing', 'servicePricing')
        .leftJoin('servicePricing.contractor', 'contractor')
        .where('contractor.id = :contractorId', { contractorId: options.contractorId });
    }

    if (options?.priceType) {
      queryBuilder.andWhere('history.priceType = :priceType', { priceType: options.priceType });
    }

    if (options?.startDate && options?.endDate) {
      queryBuilder.andWhere('history.effectiveDate BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate
      });
    }

    const allChanges = await queryBuilder.getMany();

    const totalChanges = allChanges.length;
    const averagePercentageChange = totalChanges > 0 
      ? allChanges.reduce((sum, change) => sum + Math.abs(change.percentageChange), 0) / totalChanges 
      : 0;
    
    const significantChanges = allChanges.filter(change => Math.abs(change.percentageChange) >= 10).length;
    const automaticChanges = allChanges.filter(change => change.isAutomatic).length;
    const manualChanges = totalChanges - automaticChanges;

    // Reason breakdown
    const reasonBreakdown: { [key in ChangeReason]?: number } = {};
    allChanges.forEach(change => {
      reasonBreakdown[change.changeReason] = (reasonBreakdown[change.changeReason] || 0) + 1;
    });

    const lastChange = totalChanges > 0 
      ? new Date(Math.max(...allChanges.map(change => change.effectiveDate.getTime())))
      : null;

    return {
      totalChanges,
      averagePercentageChange: Math.round(averagePercentageChange * 100) / 100,
      significantChanges,
      automaticChanges,
      manualChanges,
      reasonBreakdown,
      lastChange
    };
  }

  async remove(id: string): Promise<void> {
    const history = await this.findOne(id);
    await this.historyRepository.remove(history);
  }
}