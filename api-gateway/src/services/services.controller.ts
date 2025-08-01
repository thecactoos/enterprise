import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  private readonly servicesServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.servicesServiceUrl = process.env.SERVICES_SERVICE_URL || 'http://localhost:3007';
  }

  private async forwardRequest(method: string, endpoint: string, data?: any, params?: any) {
    try {
      const url = `${this.servicesServiceUrl}${endpoint}`;
      const config: any = { method, url };
      
      if (data) config.data = data;
      if (params) config.params = params;

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Services service error',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new HttpException(
        'Failed to connect to services service',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async create(@Body() createServiceDto: any) {
    return this.forwardRequest('POST', '/services', createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findAll(@Query() query: any) {
    return this.forwardRequest('GET', '/services', null, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get service statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.forwardRequest('GET', '/services/statistics');
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get services grouped by category' })
  @ApiResponse({ status: 200, description: 'Services grouped by category retrieved successfully' })
  async getServicesByCategory() {
    return this.forwardRequest('GET', '/services/by-category');
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular services' })
  @ApiResponse({ status: 200, description: 'Popular services retrieved successfully' })
  async getPopularServices(@Query() query: any) {
    return this.forwardRequest('GET', '/services/popular', null, query);
  }

  @Get('code/:serviceCode')
  @ApiOperation({ summary: 'Get service by code' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  async findByCode(@Param('serviceCode') serviceCode: string) {
    return this.forwardRequest('GET', `/services/code/${serviceCode}`);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.forwardRequest('GET', `/services/${id}`);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  async update(@Param('id') id: string, @Body() updateServiceDto: any) {
    return this.forwardRequest('PATCH', `/services/${id}`, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.forwardRequest('DELETE', `/services/${id}`);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate service' })
  @ApiResponse({ status: 200, description: 'Service activated successfully' })
  async activate(@Param('id') id: string) {
    return this.forwardRequest('PATCH', `/services/${id}/activate`);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate service' })
  @ApiResponse({ status: 200, description: 'Service deactivated successfully' })
  async deactivate(@Param('id') id: string) {
    return this.forwardRequest('PATCH', `/services/${id}/deactivate`);
  }

  @Post(':id/calculate')
  @ApiOperation({ summary: 'Calculate service cost and time' })
  @ApiResponse({ status: 200, description: 'Service cost calculated successfully' })
  async calculateCost(@Param('id') id: string, @Body() body: any) {
    return this.forwardRequest('POST', `/services/${id}/calculate`, body);
  }

  @Patch('bulk/activate')
  @ApiOperation({ summary: 'Bulk activate services' })
  @ApiResponse({ status: 200, description: 'Bulk activation completed' })
  async bulkActivate(@Body() body: any) {
    return this.forwardRequest('PATCH', '/services/bulk/activate', body);
  }

  @Patch('bulk/deactivate')
  @ApiOperation({ summary: 'Bulk deactivate services' })
  @ApiResponse({ status: 200, description: 'Bulk deactivation completed' })
  async bulkDeactivate(@Body() body: any) {
    return this.forwardRequest('PATCH', '/services/bulk/deactivate', body);
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check for services service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return this.forwardRequest('GET', '/services/health/check');
  }
}