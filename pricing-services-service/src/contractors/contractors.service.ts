import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Contractor, ContractorStatus, RegionalZone, SkillLevel } from './contractor.entity';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(
    @InjectRepository(Contractor)
    private contractorsRepository: Repository<Contractor>,
  ) {}

  async create(createContractorDto: CreateContractorDto): Promise<Contractor> {
    // Check for unique email
    const existingByEmail = await this.contractorsRepository.findOne({
      where: { email: createContractorDto.email }
    });
    
    if (existingByEmail) {
      throw new BadRequestException('Contractor with this email already exists');
    }

    // Check for unique NIP if provided
    if (createContractorDto.nip) {
      const existingByNip = await this.contractorsRepository.findOne({
        where: { nip: createContractorDto.nip }
      });
      
      if (existingByNip) {
        throw new BadRequestException('Contractor with this NIP already exists');
      }
    }

    const contractor = this.contractorsRepository.create(createContractorDto);
    return await this.contractorsRepository.save(contractor);
  }

  async findAll(options?: {
    status?: ContractorStatus;
    regionalZone?: RegionalZone;
    skillLevel?: SkillLevel;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Contractor[]; total: number }> {
    const queryBuilder = this.contractorsRepository.createQueryBuilder('contractor');

    // Apply filters
    if (options?.status) {
      queryBuilder.andWhere('contractor.status = :status', { status: options.status });
    }

    if (options?.regionalZone) {
      queryBuilder.andWhere('contractor.regionalZone = :regionalZone', { regionalZone: options.regionalZone });
    }

    if (options?.skillLevel) {
      queryBuilder.andWhere('contractor.skillLevel = :skillLevel', { skillLevel: options.skillLevel });
    }

    if (options?.search) {
      queryBuilder.andWhere(
        '(contractor.contractorName ILIKE :search OR contractor.email ILIKE :search OR contractor.specializations ILIKE :search)',
        { search: `%${options.search}%` }
      );
    }

    // Add relations
    queryBuilder.leftJoinAndSelect('contractor.servicePricing', 'servicePricing');

    // Apply pagination
    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    // Order by rating and experience
    queryBuilder.orderBy('contractor.averageRating', 'DESC')
                .addOrderBy('contractor.yearsExperience', 'DESC')
                .addOrderBy('contractor.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Contractor> {
    const contractor = await this.contractorsRepository.findOne({
      where: { id },
      relations: ['servicePricing']
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    return contractor;
  }

  async findByEmail(email: string): Promise<Contractor> {
    const contractor = await this.contractorsRepository.findOne({
      where: { email },
      relations: ['servicePricing']
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with email ${email} not found`);
    }

    return contractor;
  }

  async findByNip(nip: string): Promise<Contractor> {
    const contractor = await this.contractorsRepository.findOne({
      where: { nip },
      relations: ['servicePricing']
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with NIP ${nip} not found`);
    }

    return contractor;
  }

  async findByRegionalZone(regionalZone: RegionalZone): Promise<Contractor[]> {
    return await this.contractorsRepository.find({
      where: { regionalZone, status: ContractorStatus.ACTIVE },
      relations: ['servicePricing'],
      order: {
        averageRating: 'DESC',
        yearsExperience: 'DESC'
      }
    });
  }

  async findBySpecialization(specialization: string): Promise<Contractor[]> {
    return await this.contractorsRepository.find({
      where: { 
        specializations: Like(`%${specialization}%`),
        status: ContractorStatus.ACTIVE
      },
      relations: ['servicePricing'],
      order: {
        averageRating: 'DESC',
        skillLevel: 'DESC'
      }
    });
  }

  async update(id: string, updateContractorDto: UpdateContractorDto): Promise<Contractor> {
    const contractor = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateContractorDto.email && updateContractorDto.email !== contractor.email) {
      const existingByEmail = await this.contractorsRepository.findOne({
        where: { email: updateContractorDto.email }
      });
      
      if (existingByEmail) {
        throw new BadRequestException('Contractor with this email already exists');
      }
    }

    // Check NIP uniqueness if NIP is being updated
    if (updateContractorDto.nip && updateContractorDto.nip !== contractor.nip) {
      const existingByNip = await this.contractorsRepository.findOne({
        where: { nip: updateContractorDto.nip }
      });
      
      if (existingByNip) {
        throw new BadRequestException('Contractor with this NIP already exists');
      }
    }

    Object.assign(contractor, updateContractorDto);
    return await this.contractorsRepository.save(contractor);
  }

  async updateStatus(id: string, status: ContractorStatus): Promise<Contractor> {
    const contractor = await this.findOne(id);
    contractor.status = status;
    return await this.contractorsRepository.save(contractor);
  }

  async updateRating(id: string, newRating: number, jobsCompleted?: number): Promise<Contractor> {
    const contractor = await this.findOne(id);
    
    if (newRating < 0 || newRating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    contractor.averageRating = newRating;
    
    if (jobsCompleted !== undefined) {
      contractor.jobsCompleted = jobsCompleted;
    }

    return await this.contractorsRepository.save(contractor);
  }

  async remove(id: string): Promise<void> {
    const contractor = await this.findOne(id);
    await this.contractorsRepository.remove(contractor);
  }

  async getContractorStats(id: string): Promise<{
    totalServices: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    activeServices: number;
    lastUpdated: Date | null;
  }> {
    const contractor = await this.contractorsRepository.findOne({
      where: { id },
      relations: ['servicePricing']
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    const services = contractor.servicePricing || [];
    const activeServices = services.filter(s => s.isActive);
    const prices = services.map(s => s.basePrice).filter(p => p > 0);

    return {
      totalServices: services.length,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      priceRange: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices)
      } : { min: 0, max: 0 },
      activeServices: activeServices.length,
      lastUpdated: services.length > 0 ? 
        new Date(Math.max(...services.map(s => s.updatedAt.getTime()))) : null
    };
  }
}