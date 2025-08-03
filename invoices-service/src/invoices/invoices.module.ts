import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}