import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { ServiceMatcher } from './utils/service-matcher';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteItem]),
    HttpModule
  ],
  controllers: [QuotesController],
  providers: [QuotesService, ServiceMatcher],
  exports: [QuotesService]
})
export class QuotesModule {}