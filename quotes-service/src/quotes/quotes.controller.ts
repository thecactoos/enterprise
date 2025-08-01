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
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote, QuoteStatus } from './entities/quote.entity';

// Simple auth guard placeholder - replace with actual implementation
import { CanActivate, Injectable } from '@nestjs/common';

@Injectable()
class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return true; // For MVP, allow all requests
  }
}

@ApiTags('quotes')
@Controller('quotes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new quote' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Quote created successfully',
    type: Quote
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async create(
    @Body() createQuoteDto: CreateQuoteDto,
    @Request() req?: any
  ): Promise<Quote> {
    const userId = req?.user?.id;
    return this.quotesService.create(createQuoteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes with optional filtering' })
  @ApiQuery({ name: 'contactId', required: false, description: 'Filter by contact ID' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of quotes to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of quotes to skip' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Quotes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        quotes: { type: 'array', items: { $ref: '#/components/schemas/Quote' } },
        total: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query('contactId') contactId?: string,
    @Query('status') status?: QuoteStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ quotes: Quote[]; total: number }> {
    return this.quotesService.findAll(
      contactId,
      status,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get quotes statistics' })
  @ApiQuery({ name: 'contactId', required: false, description: 'Filter statistics by contact ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalQuotes: { type: 'number' },
        statusBreakdown: { type: 'object' },
        financialSummary: { 
          type: 'object',
          properties: {
            totalValue: { type: 'number' },
            averageValue: { type: 'number' },
            acceptedValue: { type: 'number' },
            conversionRate: { type: 'number' }
          }
        }
      }
    }
  })
  async getStatistics(
    @Query('contactId') contactId?: string
  ): Promise<any> {
    return this.quotesService.getStatistics(contactId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'quotes-service'
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Quote found',
    type: Quote
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Quote not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Quote> {
    return this.quotesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update quote status' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Status updated successfully',
    type: Quote
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status transition' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Quote not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: QuoteStatus; rejectionReason?: string },
    @Request() req?: any
  ): Promise<Quote> {
    if (!body.status) {
      throw new BadRequestException('Status is required');
    }

    const userId = req?.user?.id;
    return this.quotesService.updateStatus(id, body.status, userId);
  }

  @Post(':id/revision')
  @ApiOperation({ summary: 'Create new revision of quote' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Revision created successfully',
    type: Quote
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Quote cannot be revised' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Quote not found' })
  async createRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req?: any
  ): Promise<Quote> {
    const userId = req?.user?.id;
    return this.quotesService.createRevision(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quote' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Quote deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Quote cannot be deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Quote not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.quotesService.remove(id);
    return { message: 'Quote deleted successfully' };
  }

  // Additional endpoints for business workflow

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate PDF for quote' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF generated successfully' })
  async generatePdf(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    // TODO: Implement PDF generation
    return { message: 'PDF generation not yet implemented' };
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send quote to customer' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quote sent successfully' })
  async sendQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { email?: string; method?: string },
    @Request() req?: any
  ): Promise<{ message: string }> {
    const userId = req?.user?.id;
    
    // Update status to SENT
    await this.quotesService.updateStatus(id, QuoteStatus.SENT, userId);
    
    // TODO: Implement actual sending logic (email, etc.)
    return { message: 'Quote marked as sent (email integration not yet implemented)' };
  }

  @Post(':id/convert-to-order')
  @ApiOperation({ summary: 'Convert accepted quote to order' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Order created successfully' })
  async convertToOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req?: any
  ): Promise<{ message: string; orderId?: string }> {
    const quote = await this.quotesService.findOne(id);
    
    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted quotes can be converted to orders');
    }
    
    // TODO: Implement order creation in Orders Service
    return { 
      message: 'Order conversion not yet implemented - Orders Service needed',
      orderId: null 
    };
  }

  // Service Integration Endpoints

  @Get('services/suggest/:productId/:productName')
  @ApiOperation({ summary: 'Get suggested services for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'productName', description: 'Product name for matching' })
  @ApiQuery({ name: 'category', required: false, description: 'Product category' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Suggested services retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          serviceCode: { type: 'string' },
          serviceName: { type: 'string' },
          category: { type: 'string' },
          material: { type: 'string' },
          basePricePerM2: { type: 'number' },
          minimumCharge: { type: 'number' }
        }
      }
    }
  })
  async getSuggestedServices(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('productName') productName: string,
    @Query('category') category?: string
  ) {
    return this.quotesService.getSuggestedServices(productId, productName, category);
  }

  @Post(':id/services')
  @ApiOperation({ summary: 'Add services to quote based on project area' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Services added successfully',
    type: Quote
  })
  async addServicesToQuote(
    @Param('id', ParseUUIDPipe) quoteId: string,
    @Body() body: { 
      serviceCodes: string[];
      projectArea?: number;
    },
    @Request() req?: any
  ): Promise<Quote> {
    if (!body.serviceCodes || !Array.isArray(body.serviceCodes) || body.serviceCodes.length === 0) {
      throw new BadRequestException('Service codes array is required');
    }

    const userId = req?.user?.id;
    return this.quotesService.addServicesToQuote(
      quoteId,
      body.serviceCodes,
      body.projectArea,
      userId
    );
  }

  @Post(':id/services/auto-suggest')
  @ApiOperation({ summary: 'Auto-suggest and add installation services based on products in quote' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Services auto-suggested and added successfully',
    type: Quote
  })
  async autoSuggestServices(
    @Param('id', ParseUUIDPipe) quoteId: string,
    @Body() body: { includeTransport?: boolean } = {}
  ): Promise<Quote> {
    return this.quotesService.autoSuggestServices(
      quoteId,
      body.includeTransport !== false // Default to true
    );
  }

  @Delete(':id/services/:serviceItemId')
  @ApiOperation({ summary: 'Remove service item from quote' })
  @ApiParam({ name: 'id', description: 'Quote UUID' })
  @ApiParam({ name: 'serviceItemId', description: 'Service item UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service removed successfully',
    type: Quote
  })
  async removeServiceFromQuote(
    @Param('id', ParseUUIDPipe) quoteId: string,
    @Param('serviceItemId', ParseUUIDPipe) serviceItemId: string
  ): Promise<Quote> {
    return this.quotesService.removeServiceFromQuote(quoteId, serviceItemId);
  }
}