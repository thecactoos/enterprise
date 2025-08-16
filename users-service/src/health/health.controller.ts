import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkHealth() {
    return this.healthService.getHealth();
  }

  @Get('detailed')
  async checkDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}