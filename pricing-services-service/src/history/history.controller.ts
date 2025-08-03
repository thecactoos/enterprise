import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { PriceHistory, ChangeReason } from './price-history.entity';
import { PriceType } from '../pricing/service-pricing.entity';

@ApiTags('price-history')
@Controller('price-history')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get price history with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history retrieved successfully',
    type: [PriceHistory]
  })
  @ApiQuery({ name: 'servicePricingId', type: String, required: false })
  @ApiQuery({ name: 'priceType', enum: PriceType, required: false })
  @ApiQuery({ name: 'changeReason', enum: ChangeReason, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  async findAll(
    @Query('servicePricingId') servicePricingId?: string,
    @Query('priceType') priceType?: PriceType,
    @Query('changeReason') changeReason?: ChangeReason,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: PriceHistory[]; total: number }> {
    return await this.historyService.findAll({
      servicePricingId,
      priceType,
      changeReason,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get price history statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history statistics retrieved successfully'
  })
  @ApiQuery({ name: 'contractorId', type: String, required: false })
  @ApiQuery({ name: 'priceType', enum: PriceType, required: false })
  @ApiQuery({ name: 'startDate', type: String, required: false })
  @ApiQuery({ name: 'endDate', type: String, required: false })
  async getStats(
    @Query('contractorId') contractorId?: string,
    @Query('priceType') priceType?: PriceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.historyService.getPriceHistoryStats({
      contractorId,
      priceType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('significant')
  @ApiOperation({ summary: 'Get significant price changes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Significant price changes retrieved successfully',
    type: [PriceHistory]
  })
  @ApiQuery({ name: 'minPercentage', type: Number, required: false })
  async getSignificantChanges(
    @Query('minPercentage') minPercentage?: number,
  ): Promise<PriceHistory[]> {
    return await this.historyService.getSignificantPriceChanges(minPercentage);
  }

  @Get('automatic')
  @ApiOperation({ summary: 'Get automatic price changes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Automatic price changes retrieved successfully',
    type: [PriceHistory]
  })
  async getAutomaticChanges(): Promise<PriceHistory[]> {
    return await this.historyService.getAutomaticChanges();
  }

  @Get('manual')
  @ApiOperation({ summary: 'Get manual price changes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Manual price changes retrieved successfully',
    type: [PriceHistory]
  })
  async getManualChanges(): Promise<PriceHistory[]> {
    return await this.historyService.getManualChanges();
  }

  @Get('reason/:reason')
  @ApiOperation({ summary: 'Get price changes by reason' })
  @ApiParam({ name: 'reason', enum: ChangeReason })
  @ApiResponse({ 
    status: 200, 
    description: 'Price changes retrieved successfully',
    type: [PriceHistory]
  })
  async getChangesByReason(@Param('reason') reason: ChangeReason): Promise<PriceHistory[]> {
    return await this.historyService.getPriceChangesByReason(reason);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get price changes by user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price changes retrieved successfully',
    type: [PriceHistory]
  })
  async getChangesByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<PriceHistory[]> {
    return await this.historyService.getChangesByUser(userId);
  }

  @Get('contractor/:contractorId')
  @ApiOperation({ summary: 'Get price history for contractor' })
  @ApiParam({ name: 'contractorId', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history retrieved successfully',
    type: [PriceHistory]
  })
  async getHistoryByContractor(
    @Param('contractorId', ParseUUIDPipe) contractorId: string
  ): Promise<PriceHistory[]> {
    return await this.historyService.findByContractor(contractorId);
  }

  @Get('service-pricing/:servicePricingId')
  @ApiOperation({ summary: 'Get price history for service pricing' })
  @ApiParam({ name: 'servicePricingId', description: 'Service pricing UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history retrieved successfully',
    type: [PriceHistory]
  })
  async getHistoryByServicePricing(
    @Param('servicePricingId', ParseUUIDPipe) servicePricingId: string
  ): Promise<PriceHistory[]> {
    return await this.historyService.findByServicePricing(servicePricingId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get price changes in date range' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price changes retrieved successfully',
    type: [PriceHistory]
  })
  @ApiQuery({ name: 'startDate', type: String, required: true })
  @ApiQuery({ name: 'endDate', type: String, required: true })
  async getChangesInDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<PriceHistory[]> {
    return await this.historyService.getPriceChangesInDateRange(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get price history record by ID' })
  @ApiParam({ name: 'id', description: 'Price history UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Price history record retrieved successfully',
    type: PriceHistory
  })
  @ApiResponse({ status: 404, description: 'Price history record not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PriceHistory> {
    return await this.historyService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete price history record' })
  @ApiParam({ name: 'id', description: 'Price history UUID' })
  @ApiResponse({ status: 204, description: 'Price history record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Price history record not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.historyService.remove(id);
  }
}