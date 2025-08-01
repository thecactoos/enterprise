import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  private readonly contactsServiceUrl = process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005';

  constructor(private readonly httpService: HttpService) {}

  // ========================================
  // CONTACTS - GENERAL ENDPOINTS
  // ========================================

  @Get()
  @ApiOperation({ summary: 'Get all contacts (leads and clients)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of contacts' })
  async findAll(@Query() query: any) {
    const response = await this.httpService.get(`${this.contactsServiceUrl}/api/v1/contacts`, { params: query }).toPromise();
    return response.data;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contacts statistics' })
  @ApiResponse({ status: 200, description: 'Returns contacts statistics' })
  async getStats(@Query() query: any) {
    const response = await this.httpService.get(`${this.contactsServiceUrl}/api/v1/contacts/stats`, { params: query }).toPromise();
    return response.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Returns contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async findOne(@Param('id') id: string) {
    const response = await this.httpService.get(`${this.contactsServiceUrl}/api/v1/contacts/${id}`).toPromise();
    return response.data;
  }

  @Post()
  @ApiOperation({ summary: 'Create new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 409, description: 'Contact with email already exists' })
  async create(@Body() createContactDto: any) {
    const response = await this.httpService.post(`${this.contactsServiceUrl}/api/v1/contacts`, createContactDto).toPromise();
    return response.data;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async update(@Param('id') id: string, @Body() updateContactDto: any) {
    const response = await this.httpService.patch(`${this.contactsServiceUrl}/api/v1/contacts/${id}`, updateContactDto).toPromise();
    return response.data;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  @ApiResponse({ status: 204, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async remove(@Param('id') id: string) {
    const response = await this.httpService.delete(`${this.contactsServiceUrl}/api/v1/contacts/${id}`).toPromise();
    return response.data;
  }


  // ========================================
  // BULK OPERATIONS & UTILITIES
  // ========================================

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on contacts' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(@Body() bulkActionDto: any) {
    const response = await this.httpService.post(`${this.contactsServiceUrl}/api/v1/contacts/bulk-action`, bulkActionDto).toPromise();
    return response.data;
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive contact' })
  @ApiResponse({ status: 200, description: 'Contact archived successfully' })
  async archive(@Param('id') id: string) {
    const response = await this.httpService.put(`${this.contactsServiceUrl}/api/v1/contacts/${id}/archive`).toPromise();
    return response.data;
  }

  // ========================================
  // REPORTING ENDPOINTS
  // ========================================

  @Get('reports/performance')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({ status: 200, description: 'Returns performance report' })
  async getPerformanceReport(@Query('period') period?: string) {
    const params = period ? { period } : {};
    const response = await this.httpService.get(`${this.contactsServiceUrl}/api/v1/contacts/reports/performance`, { params }).toPromise();
    return response.data;
  }

  @Get('reports/forecast')
  @ApiOperation({ summary: 'Get sales forecast' })
  @ApiResponse({ status: 200, description: 'Returns sales forecast' })
  async getSalesForecast() {
    const response = await this.httpService.get(`${this.contactsServiceUrl}/api/v1/contacts/reports/forecast`).toPromise();
    return response.data;
  }
}