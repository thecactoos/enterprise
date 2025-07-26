import { Controller, Get, UseGuards, UseFilters } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { MockDataService } from '../common/services/mock-data.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@UseFilters(HttpExceptionFilter)
export class DashboardController {
  constructor(private mockDataService: MockDataService) {}
  @Get('stats')
  async getStats() {
    return this.mockDataService.getDashboardStats();
  }

  @Get('recent-clients')
  async getRecentClients() {
    return this.mockDataService.getRecentClients();
  }

  @Get('recent-notes')
  async getRecentNotes() {
    return this.mockDataService.getRecentNotes();
  }
} 