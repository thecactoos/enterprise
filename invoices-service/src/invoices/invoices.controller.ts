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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceType } from './invoice.entity';
import { CreateInvoiceDto, CreateInvoiceFromQuoteDto, BulkCreateInvoiceDto } from './dto/create-invoice.dto';
import { AddServiceToInvoiceDto, AddProductToInvoiceDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceDto, PaymentDto, CancelInvoiceDto, SendInvoiceDto, InvoiceQueryDto } from './dto/update-invoice.dto';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ==================== BASIC CRUD OPERATIONS ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create new invoice',
    description: 'Create a new Polish VAT-compliant invoice with items'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invoice created successfully',
    type: Invoice
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all invoices',
    description: 'Retrieve invoices with filtering, sorting, and pagination'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoices retrieved successfully'
  })
  async findAll(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get invoice by ID',
    description: 'Retrieve single invoice with all items and details'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice found',
    type: Invoice
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update invoice',
    description: 'Update invoice details (limited for sent/paid invoices)'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice updated successfully',
    type: Invoice
  })
  @ApiResponse({ status: 400, description: 'Invalid update data or invoice state' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto
  ): Promise<Invoice> {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete invoice',
    description: 'Delete draft invoice (only draft invoices can be deleted)'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 204, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-draft invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.invoicesService.remove(id);
  }

  // ==================== POLISH BUSINESS OPERATIONS ====================

  @Post('generate-number/:type')
  @ApiOperation({ 
    summary: 'Generate invoice number',
    description: 'Generate Polish-compliant invoice number (FV/YYYY/MM/NNNN format)'
  })
  @ApiParam({ 
    name: 'type', 
    enum: InvoiceType,
    description: 'Type of invoice number to generate'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invoice number generated',
    schema: {
      type: 'object',
      properties: {
        invoiceNumber: { type: 'string', example: 'FV/2025/01/0001' },
        invoiceType: { type: 'string', example: 'vat_invoice' }
      }
    }
  })
  async generateNumber(@Param('type') type: InvoiceType) {
    const invoiceNumber = await this.invoicesService.generateInvoiceNumber(type);
    return { invoiceNumber, invoiceType: type };
  }

  @Post(':id/validate-customer')
  @ApiOperation({ 
    summary: 'Validate customer data',
    description: 'Validate customer NIP, REGON, and other Polish business data'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer validation result'
  })
  async validateCustomer(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.invoicesService.findOne(id);
    return this.invoicesService.validateCustomerData(invoice.contactId);
  }

  @Post(':id/calculate-totals')
  @ApiOperation({ 
    summary: 'Calculate invoice totals',
    description: 'Recalculate invoice totals with Polish VAT rules'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Totals calculated successfully'
  })
  async calculateTotals(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.calculateInvoiceTotals(id);
  }

  // ==================== ITEM MANAGEMENT ====================

  @Post(':id/items/service')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add service to invoice',
    description: 'Add service item with advanced pricing from Services service'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Service added to invoice successfully'
  })
  async addService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() serviceDto: AddServiceToInvoiceDto
  ) {
    return this.invoicesService.addServiceToInvoice(id, serviceDto);
  }

  @Post(':id/items/product')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add product to invoice',
    description: 'Add product item with optimal pricing from Products service'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product added to invoice successfully'
  })
  async addProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() productDto: AddProductToInvoiceDto
  ) {
    return this.invoicesService.addProductToInvoice(id, productDto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove item from invoice',
    description: 'Remove invoice item and recalculate totals'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiParam({ name: 'itemId', description: 'Invoice item UUID' })
  @ApiResponse({ status: 204, description: 'Item removed successfully' })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string
  ): Promise<void> {
    return this.invoicesService.removeItemFromInvoice(id, itemId);
  }

  @Post(':id/recalculate')
  @ApiOperation({ 
    summary: 'Recalculate invoice',
    description: 'Recalculate all invoice items and totals'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice recalculated successfully',
    type: Invoice
  })
  async recalculate(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.invoicesService.recalculateInvoice(id);
  }

  // ==================== STATUS MANAGEMENT ====================

  @Patch(':id/send')
  @ApiOperation({ 
    summary: 'Send invoice',
    description: 'Mark invoice as sent and optionally send via email'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice sent successfully',
    type: Invoice
  })
  async sendInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() sendDto?: SendInvoiceDto
  ): Promise<Invoice> {
    return this.invoicesService.sendInvoice(id);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ 
    summary: 'Mark invoice as paid',
    description: 'Record payment and update invoice status'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice marked as paid',
    type: Invoice
  })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: PaymentDto
  ): Promise<Invoice> {
    return this.invoicesService.markAsPaid(id, paymentDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ 
    summary: 'Cancel invoice',
    description: 'Cancel invoice with reason (optionally create corrective invoice)'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invoice cancelled successfully',
    type: Invoice
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelInvoiceDto
  ): Promise<Invoice> {
    return this.invoicesService.cancelInvoice(id, cancelDto);
  }

  // ==================== ANALYTICS & REPORTING ====================

  @Get('analytics/statistics')
  @ApiOperation({ 
    summary: 'Get invoice statistics',
    description: 'Get comprehensive invoice analytics and statistics'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Start date for statistics (YYYY-MM-DD)' 
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'End date for statistics (YYYY-MM-DD)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully'
  })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    } : undefined;

    return this.invoicesService.getInvoiceStatistics(dateRange);
  }

  @Get('analytics/overdue')
  @ApiOperation({ 
    summary: 'Get overdue invoices',
    description: 'Get list of all overdue invoices'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Overdue invoices retrieved successfully'
  })
  async getOverdue() {
    return this.invoicesService.getOverdueInvoices();
  }

  @Get('analytics/vat-report')
  @ApiOperation({ 
    summary: 'Get VAT report',
    description: 'Generate Polish VAT report for specified period'
  })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'VAT report generated successfully'
  })
  async getVATReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.invoicesService.getVATReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('customer/:contactId')
  @ApiOperation({ 
    summary: 'Get customer invoices',
    description: 'Get all invoices for specific customer'
  })
  @ApiParam({ name: 'contactId', description: 'Contact UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer invoices retrieved successfully'
  })
  async getCustomerInvoices(
    @Param('contactId', ParseUUIDPipe) contactId: string
  ) {
    return this.invoicesService.getCustomerInvoices(contactId);
  }

  // ==================== PDF GENERATION ====================

  @Get(':id/pdf')
  @ApiOperation({ 
    summary: 'Generate invoice PDF',
    description: 'Generate Polish VAT invoice PDF document'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF generated successfully',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="invoice.pdf"' }
    }
  })
  async generatePDF(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const invoice = await this.invoicesService.findOne(id);
    
    // TODO: Implement PDF generation
    // const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);
    
    // For now, return JSON response
    res.json({
      message: 'PDF generation not yet implemented',
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalGross: invoice.formattedTotalGross
      }
    });
  }

  @Get(':id/proforma-pdf')
  @ApiOperation({ 
    summary: 'Generate proforma PDF',
    description: 'Generate Polish proforma invoice PDF document'
  })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Proforma PDF generated successfully'
  })
  async generateProformaPDF(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const invoice = await this.invoicesService.findOne(id);
    
    // TODO: Implement proforma PDF generation
    // const pdfBuffer = await this.pdfService.generateProformaPDF(invoice);
    
    // For now, return JSON response
    res.json({
      message: 'Proforma PDF generation not yet implemented',
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalGross: invoice.formattedTotalGross
      }
    });
  }

  // ==================== BULK OPERATIONS ====================

  @Post('bulk/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Bulk create invoices',
    description: 'Create multiple invoices in a single request'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Bulk invoice creation completed'
  })
  async bulkCreate(@Body() bulkDto: BulkCreateInvoiceDto) {
    const results = [];
    const errors = [];

    for (const invoiceDto of bulkDto.invoices) {
      try {
        const invoice = await this.invoicesService.create(invoiceDto);
        results.push({ success: true, invoice });
      } catch (error) {
        errors.push({ 
          success: false, 
          error: error.message,
          invoiceData: invoiceDto
        });
        
        if (!bulkDto.continueOnError) {
          break;
        }
      }
    }

    return {
      totalRequested: bulkDto.invoices.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  @Post('from-quote')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create invoice from quote',
    description: 'Convert existing quote to invoice'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invoice created from quote successfully',
    type: Invoice
  })
  async createFromQuote(@Body() quoteDto: CreateInvoiceFromQuoteDto) {
    // TODO: Implement quote to invoice conversion
    // return this.invoicesService.createFromQuote(quoteDto);
    
    return {
      message: 'Quote to invoice conversion not yet implemented',
      quoteId: quoteDto.quoteId
    };
  }

  // ==================== HEALTH CHECK ====================

  @Get('health/check')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if invoices service is healthy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy'
  })
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'invoices-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}