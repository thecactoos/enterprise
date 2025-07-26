import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { MockDataService } from '../common/services/mock-data.service';

@Module({
  controllers: [DashboardController],
  providers: [MockDataService],
})
export class DashboardModule {} 