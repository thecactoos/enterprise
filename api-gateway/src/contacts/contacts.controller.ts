import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AxiosError } from 'axios';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  private readonly contactsServiceUrl = process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005';

  constructor(private readonly httpService: HttpService) {}

  private handleAxiosError(error: any) {
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Forward the status code and response data from the downstream service
        throw new HttpException(
          axiosError.response.data || axiosError.message, 
          axiosError.response.status
        );
      }
    }
    // If it's not an axios error or doesn't have a response, throw generic error
    throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // ========================================
  // CONTACTS - GENERAL ENDPOINTS
  // ========================================

  @Get()
  @ApiOperation({ summary: 'Get all contacts (leads and clients)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of contacts' })
  async findAll(@Query() query: any) {
    try {
      const response = await this.httpService.axiosRef.get(`${this.contactsServiceUrl}/api/v1/contacts`, { params: query });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contacts statistics' })
  @ApiResponse({ status: 200, description: 'Returns contacts statistics' })
  async getStats(@Query() query: any) {
    try {
      const response = await this.httpService.axiosRef.get(`${this.contactsServiceUrl}/api/v1/contacts/stats`, { params: query });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Returns contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async findOne(@Param('id') id: string) {
    try {
      const response = await this.httpService.axiosRef.get(`${this.contactsServiceUrl}/api/v1/contacts/${id}`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 409, description: 'Contact with email already exists' })
  async create(@Body() createContactDto: any) {
    try {
      console.log('Creating contact with data:', JSON.stringify(createContactDto, null, 2));
      const response = await this.httpService.axiosRef.post(`${this.contactsServiceUrl}/api/v1/contacts`, createContactDto);
      return response.data;
    } catch (error) {
      console.error('Contact creation failed:', error.response?.data || error.message);
      this.handleAxiosError(error);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async update(@Param('id') id: string, @Body() updateContactDto: any) {
    try {
      const response = await this.httpService.axiosRef.patch(`${this.contactsServiceUrl}/api/v1/contacts/${id}`, updateContactDto);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  @ApiResponse({ status: 204, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async remove(@Param('id') id: string) {
    try {
      const response = await this.httpService.axiosRef.delete(`${this.contactsServiceUrl}/api/v1/contacts/${id}`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }


  // ========================================
  // BULK OPERATIONS & UTILITIES
  // ========================================

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on contacts' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  async bulkAction(@Body() bulkActionDto: any) {
    try {
      const response = await this.httpService.axiosRef.post(`${this.contactsServiceUrl}/api/v1/contacts/bulk-action`, bulkActionDto);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive contact' })
  @ApiResponse({ status: 200, description: 'Contact archived successfully' })
  async archive(@Param('id') id: string) {
    try {
      const response = await this.httpService.axiosRef.put(`${this.contactsServiceUrl}/api/v1/contacts/${id}/archive`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  // ========================================
  // REPORTING ENDPOINTS
  // ========================================

  @Get('reports/performance')
  @ApiOperation({ summary: 'Get performance report' })
  @ApiResponse({ status: 200, description: 'Returns performance report' })
  async getPerformanceReport(@Query('period') period?: string) {
    try {
      const params = period ? { period } : {};
      const response = await this.httpService.axiosRef.get(`${this.contactsServiceUrl}/api/v1/contacts/reports/performance`, { params });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  @Get('reports/forecast')
  @ApiOperation({ summary: 'Get sales forecast' })
  @ApiResponse({ status: 200, description: 'Returns sales forecast' })
  async getSalesForecast() {
    try {
      const response = await this.httpService.axiosRef.get(`${this.contactsServiceUrl}/api/v1/contacts/reports/forecast`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }
}