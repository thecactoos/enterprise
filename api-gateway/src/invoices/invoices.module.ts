import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [InvoicesController],
})
export class InvoicesModule {}