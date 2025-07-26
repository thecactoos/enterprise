import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { MockDataService } from '../common/services/mock-data.service';

@Module({
  controllers: [ClientsController],
  providers: [MockDataService],
})
export class ClientsModule {} 