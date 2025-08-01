import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, Between, MoreThan, LessThan, IsNull, Not } from 'typeorm';
import { Contact, ContactType, ContactStatus } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactStatistics {
  totalContacts: number;
  totalLeads: number;
  totalClients: number;
  
  leadsByStatus: Record<string, number>;
  clientsByStatus: Record<string, number>;
  contactsBySource: Record<string, number>;
  contactsByPriority: Record<string, number>;
  
  conversionRate: number;
  averageQualificationScore: number;
  totalPurchasesValue: number;
  
  needsFollowUp: number;
  overdue: number;
  
  monthlyStats: {
    newContacts: number;
    convertedLeads: number;
    totalRevenue: number;
  };
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    try {
      // Check for existing email only if email is provided
      if (createContactDto.email) {
        const existingContact = await this.contactRepository.findOne({
          where: { email: createContactDto.email }
        });

        if (existingContact) {
          throw new ConflictException(`Contact with email ${createContactDto.email} already exists`);
        }
      }

      // Create contact
      const contact = this.contactRepository.create(createContactDto);
      
      // Set first contact date if not provided
      if (!contact.firstContactDate) {
        contact.firstContactDate = new Date();
      }

      return await this.contactRepository.save(contact);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create contact: ${error.message}`);
    }
  }

  async findAll(query: ContactQueryDto): Promise<ContactsResponse> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.buildQueryBuilder(query);
    
    // Apply sorting
    queryBuilder.orderBy(`contact.${sortBy}`, sortOrder);

    // Apply pagination
    const [contacts, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id }
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    // Check for email conflicts if email is being updated and is not null
    if (updateContactDto.email && updateContactDto.email !== contact.email) {
      const existingContact = await this.contactRepository.findOne({
        where: { email: updateContactDto.email }
      });

      if (existingContact && existingContact.id !== id) {
        throw new ConflictException(`Contact with email ${updateContactDto.email} already exists`);
      }
    }

    // Merge updates
    Object.assign(contact, updateContactDto);

    try {
      return await this.contactRepository.save(contact);
    } catch (error) {
      throw new BadRequestException(`Failed to update contact: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }

  async archive(id: string): Promise<Contact> {
    const contact = await this.findOne(id);
    contact.isArchived = true;
    contact.isActive = false;
    return await this.contactRepository.save(contact);
  }

  async restore(id: string): Promise<Contact> {
    const contact = await this.findOne(id);
    contact.isArchived = false;
    contact.isActive = true;
    return await this.contactRepository.save(contact);
  }

  // ========================================
  // LEAD-SPECIFIC OPERATIONS
  // ========================================

  async findLeads(query: ContactQueryDto): Promise<ContactsResponse> {
    const leadQuery = { ...query, type: ContactType.LEAD };
    return this.findAll(leadQuery);
  }

  async convertLeadToClient(leadId: string, purchaseAmount?: number): Promise<Contact> {
    const lead = await this.findOne(leadId);

    if (lead.type !== ContactType.LEAD) {
      throw new BadRequestException('Contact is not a lead');
    }

    lead.convertToClient();
    
    if (purchaseAmount && purchaseAmount > 0) {
      lead.addPurchase(purchaseAmount);
    }

    return await this.contactRepository.save(lead);
  }

  async updateLeadStatus(leadId: string, status: ContactStatus): Promise<Contact> {
    const lead = await this.findOne(leadId);

    if (lead.type !== ContactType.LEAD) {
      throw new BadRequestException('Contact is not a lead');
    }

    lead.status = status;
    
    // Update last contact date when status changes
    lead.lastContactDate = new Date();
    
    // Increment contact attempts
    lead.contactAttempts += 1;

    return await this.contactRepository.save(lead);
  }

  async updateQualificationScore(leadId: string, score: number): Promise<Contact> {
    if (score < 0 || score > 100) {
      throw new BadRequestException('Qualification score must be between 0 and 100');
    }

    const lead = await this.findOne(leadId);
    lead.qualificationScore = score;

    // Auto-update status based on score
    if (score >= 60 && lead.status === ContactStatus.NEW) {
      lead.status = ContactStatus.QUALIFIED;
    } else if (score < 30 && lead.status === ContactStatus.QUALIFIED) {
      lead.status = ContactStatus.UNQUALIFIED;
    }

    return await this.contactRepository.save(lead);
  }

  // ========================================
  // CLIENT-SPECIFIC OPERATIONS
  // ========================================

  async findClients(query: ContactQueryDto): Promise<ContactsResponse> {
    const clientQuery = { ...query, type: ContactType.CLIENT };
    return this.findAll(clientQuery);
  }

  async addPurchase(clientId: string, amount: number): Promise<Contact> {
    if (amount <= 0) {
      throw new BadRequestException('Purchase amount must be greater than 0');
    }

    const client = await this.findOne(clientId);
    client.addPurchase(amount);

    return await this.contactRepository.save(client);
  }

  async getClientPurchaseHistory(clientId: string): Promise<{
    client: Contact;
    totalPurchases: number;
    lastPurchaseDate: Date;
    daysSinceLastPurchase: number;
  }> {
    const client = await this.findOne(clientId);

    if (client.type !== ContactType.CLIENT) {
      throw new BadRequestException('Contact is not a client');
    }

    const daysSinceLastPurchase = client.lastPurchaseDate 
      ? Math.floor((new Date().getTime() - new Date(client.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      client,
      totalPurchases: client.totalPurchases,
      lastPurchaseDate: client.lastPurchaseDate,
      daysSinceLastPurchase,
    };
  }

  // ========================================
  // FOLLOW-UP MANAGEMENT
  // ========================================

  async getContactsNeedingFollowUp(): Promise<Contact[]> {
    const contacts = await this.contactRepository.find({
      where: { isActive: true, isArchived: false }
    });

    return contacts.filter(contact => contact.needsFollowUp());
  }

  async getOverdueContacts(): Promise<Contact[]> {
    const contacts = await this.contactRepository.find({
      where: { 
        isActive: true, 
        isArchived: false,
        nextFollowUpDate: Not(IsNull())
      }
    });

    return contacts.filter(contact => contact.isOverdue);
  }

  async scheduleFollowUp(contactId: string, followUpDate: Date, notes?: string): Promise<Contact> {
    const contact = await this.findOne(contactId);
    
    contact.nextFollowUpDate = followUpDate;
    if (notes) {
      contact.notes = contact.notes ? `${contact.notes}\n\n${notes}` : notes;
    }

    return await this.contactRepository.save(contact);
  }

  // ========================================
  // STATISTICS AND ANALYTICS
  // ========================================

  async getStatistics(): Promise<ContactStatistics> {
    const [
      totalContacts,
      totalLeads,
      totalClients,
      leadStatusCounts,
      clientStatusCounts,
      sourceCounts,
      priorityCounts,
      avgQualificationScore,
      totalPurchasesValue,
      followUpNeeded,
      overdueContacts,
      monthlyStats
    ] = await Promise.all([
      this.contactRepository.count(),
      this.contactRepository.count({ where: { type: ContactType.LEAD } }),
      this.contactRepository.count({ where: { type: ContactType.CLIENT } }),
      this.getStatusCounts(ContactType.LEAD),
      this.getStatusCounts(ContactType.CLIENT),
      this.getSourceCounts(),
      this.getPriorityCounts(),
      this.getAverageQualificationScore(),
      this.getTotalPurchasesValue(),
      this.getFollowUpNeededCount(),
      this.getOverdueCount(),
      this.getMonthlyStats()
    ]);

    const conversionRate = totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0;

    return {
      totalContacts,
      totalLeads,
      totalClients,
      leadsByStatus: leadStatusCounts,
      clientsByStatus: clientStatusCounts,
      contactsBySource: sourceCounts,
      contactsByPriority: priorityCounts,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageQualificationScore: Math.round(avgQualificationScore * 100) / 100,
      totalPurchasesValue,
      needsFollowUp: followUpNeeded,
      overdue: overdueContacts,
      monthlyStats,
    };
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async bulkUpdateStatus(contactIds: string[], status: ContactStatus): Promise<{ updated: number }> {
    const result = await this.contactRepository.update(
      { id: Like(`%${contactIds.join('%|%')}%`) },
      { status, lastContactDate: new Date() }
    );

    return { updated: result.affected || 0 };
  }

  async bulkAssign(contactIds: string[], assignedUserId: string): Promise<{ updated: number }> {
    const result = await this.contactRepository.update(
      { id: Like(`%${contactIds.join('%|%')}%`) }, 
      { assignedUserId }
    );

    return { updated: result.affected || 0 };
  }

  async bulkArchive(contactIds: string[]): Promise<{ updated: number }> {
    const result = await this.contactRepository.update(
      { id: Like(`%${contactIds.join('%|%')}%`) },
      { isArchived: true, isActive: false }
    );

    return { updated: result.affected || 0 };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private buildQueryBuilder(query: ContactQueryDto): SelectQueryBuilder<Contact> {
    const queryBuilder = this.contactRepository.createQueryBuilder('contact');

    // Basic filters
    if (query.type) {
      queryBuilder.andWhere('contact.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('contact.status = :status', { status: query.status });
    }

    if (query.priority) {
      queryBuilder.andWhere('contact.priority = :priority', { priority: query.priority });
    }

    if (query.source) {
      queryBuilder.andWhere('contact.source = :source', { source: query.source });
    }

    if (query.businessType) {
      queryBuilder.andWhere('contact.businessType = :businessType', { businessType: query.businessType });
    }

    if (query.projectType) {
      queryBuilder.andWhere('contact.projectType = :projectType', { projectType: query.projectType });
    }

    // Search functionality
    if (query.search) {
      queryBuilder.andWhere(`(
        contact.firstName ILIKE :search OR 
        contact.lastName ILIKE :search OR 
        contact.email ILIKE :search OR 
        contact.company ILIKE :search OR 
        contact.phone ILIKE :search
      )`, { search: `%${query.search}%` });
    }

    // String filters
    if (query.company) {
      queryBuilder.andWhere('contact.company ILIKE :company', { company: `%${query.company}%` });
    }

    if (query.city) {
      queryBuilder.andWhere('contact.city ILIKE :city', { city: `%${query.city}%` });
    }

    if (query.voivodeship) {
      queryBuilder.andWhere('contact.voivodeship ILIKE :voivodeship', { voivodeship: `%${query.voivodeship}%` });
    }

    if (query.industry) {
      queryBuilder.andWhere('contact.industry ILIKE :industry', { industry: `%${query.industry}%` });
    }

    // Numeric range filters
    if (query.minQualificationScore !== undefined) {
      queryBuilder.andWhere('contact.qualificationScore >= :minQualificationScore', { 
        minQualificationScore: query.minQualificationScore 
      });
    }

    if (query.maxQualificationScore !== undefined) {
      queryBuilder.andWhere('contact.qualificationScore <= :maxQualificationScore', { 
        maxQualificationScore: query.maxQualificationScore 
      });
    }

    if (query.minEstimatedValue !== undefined) {
      queryBuilder.andWhere('contact.estimatedValue >= :minEstimatedValue', {
        minEstimatedValue: query.minEstimatedValue
      });
    }

    if (query.maxEstimatedValue !== undefined) {
      queryBuilder.andWhere('contact.estimatedValue <= :maxEstimatedValue', {
        maxEstimatedValue: query.maxEstimatedValue
      });
    }

    if (query.minTotalPurchases !== undefined) {
      queryBuilder.andWhere('contact.totalPurchases >= :minTotalPurchases', {
        minTotalPurchases: query.minTotalPurchases
      });
    }

    if (query.maxTotalPurchases !== undefined) {
      queryBuilder.andWhere('contact.totalPurchases <= :maxTotalPurchases', {
        maxTotalPurchases: query.maxTotalPurchases
      });
    }

    // Date filters
    if (query.createdAfter) {
      queryBuilder.andWhere('contact.createdAt >= :createdAfter', { 
        createdAfter: new Date(query.createdAfter) 
      });
    }

    if (query.createdBefore) {
      queryBuilder.andWhere('contact.createdAt <= :createdBefore', { 
        createdBefore: new Date(query.createdBefore) 
      });
    }

    if (query.lastContactAfter) {
      queryBuilder.andWhere('contact.lastContactDate >= :lastContactAfter', { 
        lastContactAfter: new Date(query.lastContactAfter) 
      });
    }

    if (query.lastContactBefore) {
      queryBuilder.andWhere('contact.lastContactDate <= :lastContactBefore', { 
        lastContactBefore: new Date(query.lastContactBefore) 
      });
    }

    // Relationships
    if (query.assignedUserId) {
      queryBuilder.andWhere('contact.assignedUserId = :assignedUserId', { 
        assignedUserId: query.assignedUserId 
      });
    }

    if (query.unassigned) {
      queryBuilder.andWhere('contact.assignedUserId IS NULL');
    }

    // Status flags
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('contact.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.isArchived !== undefined) {
      queryBuilder.andWhere('contact.isArchived = :isArchived', { isArchived: query.isArchived });
    }

    // Tags filter
    if (query.tags) {
      const tagList = query.tags.split(',').map(tag => tag.trim());
      queryBuilder.andWhere('contact.tags && :tags', { tags: tagList });
    }

    return queryBuilder;
  }

  private async getStatusCounts(type: ContactType): Promise<Record<string, number>> {
    const results = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.status')
      .addSelect('COUNT(*)', 'count')
      .where('contact.type = :type', { type })
      .groupBy('contact.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.contact_status] = parseInt(result.count);
    });

    return counts;
  }

  private async getSourceCounts(): Promise<Record<string, number>> {
    const results = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('contact.source')
      .getRawMany();

    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.contact_source] = parseInt(result.count);
    });

    return counts;
  }

  private async getPriorityCounts(): Promise<Record<string, number>> {
    const results = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('contact.priority')
      .getRawMany();

    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.contact_priority] = parseInt(result.count);
    });

    return counts;
  }

  private async getAverageQualificationScore(): Promise<number> {
    const result = await this.contactRepository
      .createQueryBuilder('contact')
      .select('AVG(contact.qualificationScore)', 'average')
      .where('contact.type = :type', { type: ContactType.LEAD })
      .getRawOne();

    return parseFloat(result?.average || '0');
  }

  private async getTotalPurchasesValue(): Promise<number> {
    const result = await this.contactRepository
      .createQueryBuilder('contact')
      .select('SUM(contact.totalPurchases)', 'total')
      .where('contact.type = :type', { type: ContactType.CLIENT })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  private async getFollowUpNeededCount(): Promise<number> {
    // This is a simplified version - in real implementation,
    // you might want to use a more complex query or computed field
    const contacts = await this.contactRepository.find({
      where: { isActive: true, isArchived: false }
    });

    return contacts.filter(contact => contact.needsFollowUp()).length;
  }

  private async getOverdueCount(): Promise<number> {
    const contacts = await this.contactRepository.find({
      where: { 
        isActive: true, 
        isArchived: false,
        nextFollowUpDate: Not(IsNull())
      }
    });

    return contacts.filter(contact => contact.isOverdue).length;
  }

  private async getMonthlyStats(): Promise<{
    newContacts: number;
    convertedLeads: number;
    totalRevenue: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newContacts, convertedLeads, totalRevenue] = await Promise.all([
      this.contactRepository.count({
        where: { createdAt: MoreThan(startOfMonth) }
      }),
      this.contactRepository.count({
        where: { 
          type: ContactType.CLIENT,
          convertedAt: MoreThan(startOfMonth)
        }
      }),
      this.contactRepository
        .createQueryBuilder('contact')
        .select('SUM(contact.totalPurchases)', 'total')
        .where('contact.type = :type', { type: ContactType.CLIENT })
        .andWhere('contact.lastPurchaseDate >= :startOfMonth', { startOfMonth })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0'))
    ]);

    return {
      newContacts,
      convertedLeads,
      totalRevenue,
    };
  }
}