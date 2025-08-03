import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  Res,
  HttpException,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InvoicesController {
  private readonly invoicesServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.invoicesServiceUrl = process.env.INVOICES_SERVICE_URL || 'http://invoices-service:3008';
  }

  private async forwardRequest(method: string, endpoint: string, data?: any, params?: any, headers?: any) {
    try {
      const url = `${this.invoicesServiceUrl}${endpoint}`;
      const config: any = { method, url };
      
      if (data) config.data = data;
      if (params) config.params = params;
      if (headers) config.headers = headers;

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Invoices service error',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw new HttpException(
        'Failed to connect to invoices service',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  // ==================== BASIC CRUD OPERATIONS ====================

  @Post()
  @ApiOperation({ 
    summary: 'Create new invoice',
    description: 'Create a new Polish VAT-compliant invoice with items'
  })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createInvoiceDto: any) {
    return this.forwardRequest('POST', '/invoices', createInvoiceDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all invoices',
    description: 'Retrieve invoices with filtering, sorting, and pagination'
  })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async findAll(@Query() query: any) {
    return this.forwardRequest('GET', '/invoices', null, query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get invoice by ID',
    description: 'Retrieve single invoice with all items and details'
  })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id') id: string) {
    return this.forwardRequest('GET', `/invoices/${id}`);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update invoice',
    description: 'Update invoice details (limited for sent/paid invoices)'
  })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data or invoice state' })
  async update(@Param('id') id: string, @Body() updateInvoiceDto: any) {
    return this.forwardRequest('PATCH', `/invoices/${id}`, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete invoice',
    description: 'Delete draft invoice (only draft invoices can be deleted)'
  })
  @ApiResponse({ status: 204, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-draft invoice' })
  async remove(@Param('id') id: string) {
    return this.forwardRequest('DELETE', `/invoices/${id}`);
  }

  // ==================== POLISH BUSINESS OPERATIONS ====================

  @Post('generate-number/:type')
  @ApiOperation({ 
    summary: 'Generate invoice number',
    description: 'Generate Polish-compliant invoice number (FV/YYYY/MM/NNNN format)'
  })
  @ApiResponse({ status: 201, description: 'Invoice number generated' })
  async generateNumber(@Param('type') type: string) {
    return this.forwardRequest('POST', `/invoices/generate-number/${type}`);
  }

  @Post(':id/validate-customer')
  @ApiOperation({ 
    summary: 'Validate customer data',
    description: 'Validate customer NIP, REGON, and other Polish business data'
  })
  @ApiResponse({ status: 200, description: 'Customer validation result' })
  async validateCustomer(@Param('id') id: string) {
    return this.forwardRequest('POST', `/invoices/${id}/validate-customer`);
  }

  @Post(':id/calculate-totals')
  @ApiOperation({ 
    summary: 'Calculate invoice totals',
    description: 'Recalculate invoice totals with Polish VAT rules'
  })
  @ApiResponse({ status: 200, description: 'Totals calculated successfully' })
  async calculateTotals(@Param('id') id: string) {
    return this.forwardRequest('POST', `/invoices/${id}/calculate-totals`);
  }

  // ==================== ITEM MANAGEMENT ====================

  @Post(':id/items/service')
  @ApiOperation({ 
    summary: 'Add service to invoice',
    description: 'Add service item with advanced pricing from Services service'
  })
  @ApiResponse({ status: 201, description: 'Service added to invoice successfully' })
  async addService(@Param('id') id: string, @Body() serviceDto: any) {
    return this.forwardRequest('POST', `/invoices/${id}/items/service`, serviceDto);
  }

  @Post(':id/items/product')
  @ApiOperation({ 
    summary: 'Add product to invoice',
    description: 'Add product item with optimal pricing from Products service'
  })
  @ApiResponse({ status: 201, description: 'Product added to invoice successfully' })
  async addProduct(@Param('id') id: string, @Body() productDto: any) {
    return this.forwardRequest('POST', `/invoices/${id}/items/product`, productDto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ 
    summary: 'Remove item from invoice',
    description: 'Remove invoice item and recalculate totals'
  })
  @ApiResponse({ status: 204, description: 'Item removed successfully' })
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.forwardRequest('DELETE', `/invoices/${id}/items/${itemId}`);
  }

  @Post(':id/recalculate')
  @ApiOperation({ 
    summary: 'Recalculate invoice',
    description: 'Recalculate all invoice items and totals'
  })
  @ApiResponse({ status: 200, description: 'Invoice recalculated successfully' })
  async recalculate(@Param('id') id: string) {
    return this.forwardRequest('POST', `/invoices/${id}/recalculate`);
  }

  // ==================== STATUS MANAGEMENT ====================

  @Patch(':id/send')
  @ApiOperation({ 
    summary: 'Send invoice',
    description: 'Mark invoice as sent and optionally send via email'
  })
  @ApiResponse({ status: 200, description: 'Invoice sent successfully' })
  async sendInvoice(@Param('id') id: string, @Body() sendDto?: any) {
    return this.forwardRequest('PATCH', `/invoices/${id}/send`, sendDto);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ 
    summary: 'Mark invoice as paid',
    description: 'Record payment and update invoice status'
  })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  async markPaid(@Param('id') id: string, @Body() paymentDto: any) {
    return this.forwardRequest('PATCH', `/invoices/${id}/mark-paid`, paymentDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ 
    summary: 'Cancel invoice',
    description: 'Cancel invoice with reason (optionally create corrective invoice)'
  })
  @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
  async cancel(@Param('id') id: string, @Body() cancelDto: any) {
    return this.forwardRequest('PATCH', `/invoices/${id}/cancel`, cancelDto);
  }

  // ==================== ANALYTICS & REPORTING ====================

  @Get('analytics/statistics')
  @ApiOperation({ 
    summary: 'Get invoice statistics',
    description: 'Get comprehensive invoice analytics and statistics'
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics(@Query() query: any) {
    return this.forwardRequest('GET', '/invoices/analytics/statistics', null, query);
  }

  @Get('analytics/overdue')
  @ApiOperation({ 
    summary: 'Get overdue invoices',
    description: 'Get list of all overdue invoices'
  })
  @ApiResponse({ status: 200, description: 'Overdue invoices retrieved successfully' })
  async getOverdue() {
    return this.forwardRequest('GET', '/invoices/analytics/overdue');
  }

  @Get('analytics/vat-report')
  @ApiOperation({ 
    summary: 'Get VAT report',
    description: 'Generate Polish VAT report for specified period'
  })
  @ApiResponse({ status: 200, description: 'VAT report generated successfully' })
  async getVATReport(@Query() query: any) {
    return this.forwardRequest('GET', '/invoices/analytics/vat-report', null, query);
  }

  @Get('customer/:contactId')
  @ApiOperation({ 
    summary: 'Get customer invoices',
    description: 'Get all invoices for specific customer'
  })
  @ApiResponse({ status: 200, description: 'Customer invoices retrieved successfully' })
  async getCustomerInvoices(@Param('contactId') contactId: string) {
    return this.forwardRequest('GET', `/invoices/customer/${contactId}`);
  }

  // ==================== PDF GENERATION ====================

  @Get(':id/pdf')
  @ApiOperation({ 
    summary: 'Generate invoice PDF',
    description: 'Generate Polish VAT invoice PDF document'
  })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  async generatePDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.forwardRequest('GET', `/invoices/${id}/pdf`);
      res.json(result);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id/proforma-pdf')
  @ApiOperation({ 
    summary: 'Generate proforma PDF',
    description: 'Generate Polish proforma invoice PDF document'
  })
  @ApiResponse({ status: 200, description: 'Proforma PDF generated successfully' })
  async generateProformaPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.forwardRequest('GET', `/invoices/${id}/proforma-pdf`);
      res.json(result);
    } catch (error) {
      throw error;
    }
  }

  // ==================== BULK OPERATIONS ====================

  @Post('bulk/create')
  @ApiOperation({ 
    summary: 'Bulk create invoices',
    description: 'Create multiple invoices in a single request'
  })
  @ApiResponse({ status: 201, description: 'Bulk invoice creation completed' })
  async bulkCreate(@Body() bulkDto: any) {
    return this.forwardRequest('POST', '/invoices/bulk/create', bulkDto);
  }

  @Post('from-quote')
  @ApiOperation({ 
    summary: 'Create invoice from quote',
    description: 'Convert existing quote to invoice'
  })
  @ApiResponse({ status: 201, description: 'Invoice created from quote successfully' })
  async createFromQuote(@Body() quoteDto: any) {
    return this.forwardRequest('POST', '/invoices/from-quote', quoteDto);
  }

  // ==================== HEALTH CHECK ====================

  @Get('health/check')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if invoices service is healthy'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return this.forwardRequest('GET', '/invoices/health/check');
  }
}