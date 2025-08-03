import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { UpdateServicePricingDto } from './dto/update-service-pricing.dto';
import { ServicePricing, PriceType, PricingTier } from './service-pricing.entity';
import { ChangeReason } from '../history/price-history.entity';

@ApiTags('pricing')
@Controller('pricing')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Create new service pricing' })
  @ApiResponse({ 
    status: 201, 
    description: 'Service pricing successfully created',
    type: ServicePricing
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(
    @Body() createPricingDto: CreateServicePricingDto,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
  ): Promise<ServicePricing> {
    return await this.pricingService.create(createPricingDto, userId, userName);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service pricing with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service pricing retrieved successfully',
    type: [ServicePricing]
  })
  @ApiQuery({ name: 'serviceId', type: String, required: false })
  @ApiQuery({ name: 'contractorId', type: String, required: false })
  @ApiQuery({ name: 'priceType', enum: PriceType, required: false })
  @ApiQuery({ name: 'pricingTier', enum: PricingTier, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  async findAll(
    @Query('serviceId') serviceId?: string,
    @Query('contractorId') contractorId?: string,
    @Query('priceType') priceType?: PriceType,
    @Query('pricingTier') pricingTier?: PricingTier,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: ServicePricing[]; total: number }> {
    return await this.pricingService.findAll({
      serviceId,
      contractorId,
      priceType,
      pricingTier,
      isActive,
      search,
      limit,
      offset,
    });
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get pricing for specific service' })
  @ApiParam({ name: 'serviceId', description: 'Service UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service pricing retrieved successfully',
    type: [ServicePricing]
  })
  async findByService(@Param('serviceId', ParseUUIDPipe) serviceId: string): Promise<ServicePricing[]> {
    return await this.pricingService.findByService(serviceId);
  }

  @Get('contractor/:contractorId')
  @ApiOperation({ summary: 'Get pricing for specific contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor pricing retrieved successfully',
    type: [ServicePricing]
  })
  async findByContractor(@Param('contractorId', ParseUUIDPipe) contractorId: string): Promise<ServicePricing[]> {
    return await this.pricingService.findByContractor(contractorId);
  }

  @Get('type/:priceType')
  @ApiOperation({ summary: 'Get pricing by price type' })
  @ApiParam({ name: 'priceType', enum: PriceType })
  @ApiResponse({ 
    status: 200, 
    description: 'Pricing retrieved successfully',
    type: [ServicePricing]
  })
  async findByPriceType(@Param('priceType') priceType: PriceType): Promise<ServicePricing[]> {
    return await this.pricingService.findByPriceType(priceType);
  }

  @Get('service/:serviceId/active')
  @ApiOperation({ summary: 'Get active pricing for service' })
  @ApiParam({ name: 'serviceId', description: 'Service UUID' })
  @ApiQuery({ name: 'date', type: String, required: false, description: 'Date to check (ISO string)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active pricing retrieved successfully',
    type: [ServicePricing]
  })
  async findActiveForService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query('date') date?: string,
  ): Promise<ServicePricing[]> {
    const checkDate = date ? new Date(date) : new Date();
    return await this.pricingService.findActiveForService(serviceId, checkDate);
  }

  @Get('service/:serviceId/competitive')
  @ApiOperation({ summary: 'Get competitive pricing analysis for service' })
  @ApiParam({ name: 'serviceId', description: 'Service UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Competitive pricing analysis retrieved successfully'
  })
  async getCompetitivePricing(@Param('serviceId', ParseUUIDPipe) serviceId: string) {
    return await this.pricingService.getCompetitivePricing(serviceId);
  }

  @Get('service/:serviceId/trends')
  @ApiOperation({ summary: 'Get pricing trends for service' })
  @ApiParam({ name: 'serviceId', description: 'Service UUID' })
  @ApiQuery({ name: 'days', type: Number, required: false, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pricing trends retrieved successfully'
  })
  async getPricingTrends(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query('days') days?: number,
  ) {
    return await this.pricingService.getPricingTrends(serviceId, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service pricing by ID' })
  @ApiParam({ name: 'id', description: 'Service pricing UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service pricing retrieved successfully',
    type: ServicePricing
  })
  @ApiResponse({ status: 404, description: 'Service pricing not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ServicePricing> {
    return await this.pricingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service pricing' })
  @ApiParam({ name: 'id', description: 'Service pricing UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service pricing updated successfully',
    type: ServicePricing
  })
  @ApiResponse({ status: 404, description: 'Service pricing not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePricingDto: UpdateServicePricingDto,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
    @Query('changeReason') changeReason?: ChangeReason,
  ): Promise<ServicePricing> {
    return await this.pricingService.update(
      id, 
      updatePricingDto, 
      userId, 
      userName, 
      changeReason || ChangeReason.OTHER
    );
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate service pricing' })
  @ApiParam({ name: 'id', description: 'Service pricing UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service pricing deactivated successfully',
    type: ServicePricing
  })
  @ApiResponse({ status: 404, description: 'Service pricing not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
  ): Promise<ServicePricing> {
    return await this.pricingService.deactivate(id, userId, userName);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple pricing records' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk update completed successfully',
    type: [ServicePricing]
  })
  async bulkUpdate(
    @Body() updates: Array<{
      id: string;
      newPrice: number;
      reason: ChangeReason;
      notes?: string;
    }>,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
  ): Promise<ServicePricing[]> {
    return await this.pricingService.bulkUpdatePrices(updates, userId, userName);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service pricing' })
  @ApiParam({ name: 'id', description: 'Service pricing UUID' })
  @ApiResponse({ status: 204, description: 'Service pricing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service pricing not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.pricingService.remove(id);
  }
}