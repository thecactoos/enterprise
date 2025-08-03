import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { ServicePricing } from './service-pricing.entity';
import { ContractorsModule } from '../contractors/contractors.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicePricing]),
    ContractorsModule,
    HistoryModule,
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService, TypeOrmModule],
})
export class PricingModule {}