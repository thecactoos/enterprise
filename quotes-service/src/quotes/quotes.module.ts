import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { ServiceMatcher } from './utils/service-matcher';
import { PricingService } from './services/pricing.service';
import { QuoteItemsGeneratorService } from './services/quote-items-generator.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteItem]),
    HttpModule,
    AuthModule
  ],
  controllers: [QuotesController],
  providers: [QuotesService, ServiceMatcher, PricingService, QuoteItemsGeneratorService],
  exports: [QuotesService]
})
export class QuotesModule {}