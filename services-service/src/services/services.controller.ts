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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { Service, ServiceStatus } from './service.entity';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  @Post()
  @ApiOperation({
    summary: 'Create new service',
    description: 'Create a new flooring service in the system'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service created successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service with this code already exists'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all services with filtering and pagination',
    description: 'Retrieve services with advanced filtering, searching, and pagination capabilities'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    }
  })
  async findAll(@Query() query: ServiceQueryDto) {
    return this.servicesService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get service statistics and analytics',
    description: 'Retrieve comprehensive statistics including category distribution, pricing analytics, and service counts'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalServices: { type: 'number' },
        statusBreakdown: { type: 'object' },
        categoryBreakdown: { type: 'array' },
        materialBreakdown: { type: 'array' },
        pricing: { type: 'object' },
        timing: { type: 'object' }
      }
    }
  })
  async getStatistics() {
    return this.servicesService.getServiceStatistics();
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get services grouped by category',
    description: 'Retrieve all active services grouped by their categories for organized display'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services grouped by category retrieved successfully'
  })
  async getServicesByCategory() {
    return this.servicesService.getServicesByCategory();
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular services',
    description: 'Retrieve most popular or frequently used services'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of services to return (default: 10, max: 50)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Popular services retrieved successfully',
    type: [Service]
  })
  async getPopularServices(@Query('limit') limit?: number) {
    const serviceLimit = Math.min(limit || 10, 50);
    return this.servicesService.getPopularServices(serviceLimit);
  }

  @Get('code/:serviceCode')
  @ApiOperation({
    summary: 'Get service by code',
    description: 'Retrieve a specific service by its unique code'
  })
  @ApiParam({ name: 'serviceCode', type: String, description: 'Service code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async findByCode(@Param('serviceCode') serviceCode: string): Promise<Service> {
    return this.servicesService.findByCode(serviceCode);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Retrieve a specific service by its unique identifier'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service retrieved successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update service',
    description: 'Update an existing service with partial data'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service updated successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service code already exists for another service'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete service',
    description: 'Permanently delete a service from the system'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Service deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.servicesService.remove(id);
  }

  // ========================================
  // SERVICE STATUS MANAGEMENT
  // ========================================

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate service',
    description: 'Set service status to active'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service activated successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<Service> {
    return this.servicesService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate service',
    description: 'Set service status to inactive'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service deactivated successfully',
    type: Service
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Service> {
    return this.servicesService.deactivate(id);
  }

  // ========================================
  // SERVICE CALCULATIONS
  // ========================================

  @Post(':id/calculate')
  @ApiOperation({
    summary: 'Calculate service cost and time',
    description: 'Calculate total cost and time for a service based on area'
  })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        areaM2: { type: 'number', minimum: 0.01, description: 'Area in square meters' }
      },
      required: ['areaM2']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service cost calculated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid area value'
  })
  async calculateCost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { areaM2: number }
  ) {
    return this.servicesService.calculateServiceCost(id, body.areaM2);
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  @Patch('bulk/activate')
  @ApiOperation({
    summary: 'Bulk activate services',
    description: 'Activate multiple services at once'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serviceIds: { type: 'array', items: { type: 'string' }, description: 'Array of service UUIDs' }
      },
      required: ['serviceIds']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk activation completed',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', description: 'Number of services updated' }
      }
    }
  })
  async bulkActivate(@Body() body: { serviceIds: string[] }) {
    return this.servicesService.bulkEnable(body.serviceIds);
  }

  @Patch('bulk/deactivate')
  @ApiOperation({
    summary: 'Bulk deactivate services',
    description: 'Deactivate multiple services at once'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serviceIds: { type: 'array', items: { type: 'string' }, description: 'Array of service UUIDs' }
      },
      required: ['serviceIds']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk deactivation completed',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number', description: 'Number of services updated' }
      }
    }
  })
  async bulkDeactivate(@Body() body: { serviceIds: string[] }) {
    return this.servicesService.bulkDisable(body.serviceIds);
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  @Get('health/check')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the services service is running properly'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'services-service' }
      }
    }
  })
  async healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'services-service'
    };
  }
}