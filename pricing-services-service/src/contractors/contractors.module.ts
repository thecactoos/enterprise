import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';
import { Contractor } from './contractor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contractor])],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService, TypeOrmModule],
})
export class ContractorsModule {}