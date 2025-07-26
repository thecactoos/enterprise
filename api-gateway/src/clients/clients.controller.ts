import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MockDataService } from '../common/services/mock-data.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private mockDataService: MockDataService) {}

  @Get()
  findAll() {
    return this.mockDataService.getAllClients();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const client = this.mockDataService.getClientById(parseInt(id));
    if (!client) {
      throw new Error('Client not found');
    }
    return client;
  }

  @Post()
  create(@Body() clientData: any) {
    return this.mockDataService.createClient(clientData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() clientData: any) {
    return this.mockDataService.updateClient(parseInt(id), clientData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mockDataService.deleteClient(parseInt(id));
  }
} 