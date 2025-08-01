import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { Contact, ContactStatus, ContactType } from './contact.entity';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  @Post()
  @ApiOperation({ 
    summary: 'Create new contact',
    description: 'Create a new contact (lead or client) in the system'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Contact created successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Contact with this email already exists' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all contacts with filtering and pagination',
    description: 'Retrieve contacts with advanced filtering, searching, and pagination capabilities'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contacts retrieved successfully',
    schema: { type: 'object', properties: { data: { type: 'array' }, total: { type: 'number' }, page: { type: 'number' }, totalPages: { type: 'number' } } }
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'type', required: false, enum: ContactType, description: 'Filter by contact type' })
  @ApiQuery({ name: 'status', required: false, enum: ContactStatus, description: 'Filter by contact status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, email, company, phone' })
  @ApiQuery({ name: 'assignedUserId', required: false, type: String, description: 'Filter by assigned user' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  async findAll(@Query() query: ContactQueryDto): Promise<any> {
    return this.contactsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get contact statistics and analytics',
    description: 'Retrieve comprehensive statistics including conversion rates, status distributions, and performance metrics'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully',
    schema: { type: 'object', properties: { totalContacts: { type: 'number' }, leadStats: { type: 'object' }, clientStats: { type: 'object' } } }
  })
  async getStatistics(): Promise<any> {
    return this.contactsService.getStatistics();
  }

  @Get('follow-up/needed')
  @ApiOperation({ 
    summary: 'Get contacts needing follow-up',
    description: 'Retrieve all contacts that need follow-up based on priority and last contact date'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contacts needing follow-up retrieved successfully',
    type: [Contact]
  })
  async getContactsNeedingFollowUp(): Promise<Contact[]> {
    return this.contactsService.getContactsNeedingFollowUp();
  }

  @Get('follow-up/overdue')
  @ApiOperation({ 
    summary: 'Get overdue contacts',
    description: 'Retrieve all contacts with overdue follow-up dates'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Overdue contacts retrieved successfully',
    type: [Contact]
  })
  async getOverdueContacts(): Promise<Contact[]> {
    return this.contactsService.getOverdueContacts();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get contact by ID',
    description: 'Retrieve a specific contact by their unique identifier'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contact retrieved successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Contact> {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update contact',
    description: 'Update an existing contact with partial data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contact updated successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email already exists for another contact' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateContactDto: UpdateContactDto
  ): Promise<Contact> {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete contact',
    description: 'Permanently delete a contact from the system'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Contact deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contactsService.remove(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ 
    summary: 'Archive contact',
    description: 'Archive a contact instead of deleting it'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contact archived successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<Contact> {
    return this.contactsService.archive(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ 
    summary: 'Restore archived contact',
    description: 'Restore a previously archived contact'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contact restored successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Contact> {
    return this.contactsService.restore(id);
  }

  // ========================================
  // LEAD-SPECIFIC ENDPOINTS
  // ========================================

  @Get('leads/all')
  @ApiOperation({ 
    summary: 'Get all leads',
    description: 'Retrieve all contacts with type LEAD, with filtering and pagination'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Leads retrieved successfully',
    schema: { type: 'object', properties: { data: { type: 'array' }, total: { type: 'number' }, page: { type: 'number' }, totalPages: { type: 'number' } } }
  })
  async findLeads(@Query() query: ContactQueryDto): Promise<any> {
    return this.contactsService.findLeads(query);
  }

  @Patch(':id/convert-to-client')
  @ApiOperation({ 
    summary: 'Convert lead to client',
    description: 'Convert a lead to a client, optionally with initial purchase amount'
  })
  @ApiParam({ name: 'id', type: String, description: 'Lead UUID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        purchaseAmount: { type: 'number', minimum: 0, description: 'Initial purchase amount' } 
      } 
    },
    required: false
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lead converted to client successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lead not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Contact is not a lead' 
  })
  async convertLeadToClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { purchaseAmount?: number }
  ): Promise<Contact> {
    return this.contactsService.convertLeadToClient(id, body?.purchaseAmount);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Update lead status',
    description: 'Update the status of a lead and increment contact attempts'
  })
  @ApiParam({ name: 'id', type: String, description: 'Lead UUID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        status: { enum: Object.values(ContactStatus), description: 'New status for the lead' } 
      },
      required: ['status']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lead status updated successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lead not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Contact is not a lead' 
  })
  async updateLeadStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: ContactStatus }
  ): Promise<Contact> {
    return this.contactsService.updateLeadStatus(id, body.status);
  }

  @Patch(':id/qualification-score')
  @ApiOperation({ 
    summary: 'Update lead qualification score',
    description: 'Update the qualification score for a lead (0-100) and auto-update status if needed'
  })
  @ApiParam({ name: 'id', type: String, description: 'Lead UUID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        score: { type: 'integer', minimum: 0, maximum: 100, description: 'Qualification score (0-100)' } 
      },
      required: ['score']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Qualification score updated successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Lead not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid score range or contact is not a lead' 
  })
  async updateQualificationScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { score: number }
  ): Promise<Contact> {
    return this.contactsService.updateQualificationScore(id, body.score);
  }

  // ========================================
  // CLIENT-SPECIFIC ENDPOINTS
  // ========================================

  @Get('clients/all')
  @ApiOperation({ 
    summary: 'Get all clients',
    description: 'Retrieve all contacts with type CLIENT, with filtering and pagination'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Clients retrieved successfully',
    schema: { type: 'object', properties: { data: { type: 'array' }, total: { type: 'number' }, page: { type: 'number' }, totalPages: { type: 'number' } } }
  })
  async findClients(@Query() query: ContactQueryDto): Promise<any> {
    return this.contactsService.findClients(query);
  }

  @Post(':id/purchase')
  @ApiOperation({ 
    summary: 'Add purchase to client',
    description: 'Record a new purchase for a client, updating total purchases and last purchase date'
  })
  @ApiParam({ name: 'id', type: String, description: 'Client UUID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        amount: { type: 'number', minimum: 0.01, description: 'Purchase amount' } 
      },
      required: ['amount']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Purchase added successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Client not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid purchase amount' 
  })
  async addPurchase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount: number }
  ): Promise<Contact> {
    return this.contactsService.addPurchase(id, body.amount);
  }

  @Get(':id/purchase-history')
  @ApiOperation({ 
    summary: 'Get client purchase history',
    description: 'Retrieve purchase history and statistics for a specific client'
  })
  @ApiParam({ name: 'id', type: String, description: 'Client UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Purchase history retrieved successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Client not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Contact is not a client' 
  })
  async getClientPurchaseHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.getClientPurchaseHistory(id);
  }

  // ========================================
  // FOLLOW-UP MANAGEMENT
  // ========================================

  @Post(':id/schedule-follow-up')
  @ApiOperation({ 
    summary: 'Schedule follow-up',
    description: 'Schedule a follow-up date for a contact with optional notes'
  })
  @ApiParam({ name: 'id', type: String, description: 'Contact UUID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        followUpDate: { type: 'string', format: 'date-time', description: 'Follow-up date and time' },
        notes: { type: 'string', description: 'Optional notes for the follow-up' }
      },
      required: ['followUpDate']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Follow-up scheduled successfully',
    type: Contact
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Contact not found' 
  })
  async scheduleFollowUp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { followUpDate: string; notes?: string }
  ): Promise<Contact> {
    return this.contactsService.scheduleFollowUp(
      id, 
      new Date(body.followUpDate), 
      body.notes
    );
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  @Patch('bulk/status')
  @ApiOperation({ 
    summary: 'Bulk update status',
    description: 'Update status for multiple contacts at once'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        contactIds: { type: 'array', items: { type: 'string' }, description: 'Array of contact UUIDs' },
        status: { enum: Object.values(ContactStatus), description: 'New status for all contacts' }
      },
      required: ['contactIds', 'status']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Bulk status update completed',
    schema: { 
      type: 'object', 
      properties: { 
        updated: { type: 'number', description: 'Number of contacts updated' } 
      } 
    }
  })
  async bulkUpdateStatus(
    @Body() body: { contactIds: string[]; status: ContactStatus }
  ): Promise<{ updated: number }> {
    return this.contactsService.bulkUpdateStatus(body.contactIds, body.status);
  }

  @Patch('bulk/assign')
  @ApiOperation({ 
    summary: 'Bulk assign contacts',
    description: 'Assign multiple contacts to a user at once'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        contactIds: { type: 'array', items: { type: 'string' }, description: 'Array of contact UUIDs' },
        assignedUserId: { type: 'string', description: 'User UUID to assign contacts to' }
      },
      required: ['contactIds', 'assignedUserId']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Bulk assignment completed',
    schema: { 
      type: 'object', 
      properties: { 
        updated: { type: 'number', description: 'Number of contacts assigned' } 
      } 
    }
  })
  async bulkAssign(
    @Body() body: { contactIds: string[]; assignedUserId: string }
  ): Promise<{ updated: number }> {
    return this.contactsService.bulkAssign(body.contactIds, body.assignedUserId);
  }

  @Patch('bulk/archive')
  @ApiOperation({ 
    summary: 'Bulk archive contacts',
    description: 'Archive multiple contacts at once'
  })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        contactIds: { type: 'array', items: { type: 'string' }, description: 'Array of contact UUIDs' }
      },
      required: ['contactIds']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Bulk archive completed',
    schema: { 
      type: 'object', 
      properties: { 
        updated: { type: 'number', description: 'Number of contacts archived' } 
      } 
    }
  })
  async bulkArchive(
    @Body() body: { contactIds: string[] }
  ): Promise<{ updated: number }> {
    return this.contactsService.bulkArchive(body.contactIds);
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  @Get('health/check')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if the contacts service is running properly'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'contacts-service' }
      }
    }
  })
  async healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'contacts-service'
    };
  }
}