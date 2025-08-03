import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { PriceHistory } from './price-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService, TypeOrmModule],
})
export class HistoryModule {}